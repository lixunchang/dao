<script setup>
import { ref, onMounted, nextTick, onUnmounted } from 'vue'
import GitHubAPI from './services/githubService.js'

// GitHub API 配置 (需要替换为实际的用户名和仓库名)
const githubAPI = new GitHubAPI('lixunchang', 'dao');

// 定义视图状态
const currentView = ref('taichi')
const touchStartX = ref(0)
const touchStartY = ref(0)
const touchEndX = ref(0)
const touchEndY = ref(0)
const touchCount = ref(0) // 用于记录触摸点数量

// 数据状态
const quotes = ref([])
const sages = ref([
  {
    id: 1,
    name: "老子",
    avatar: "",
    philosophy: "道法自然，无为而治",
    school: "道家"
  },
  {
    id: 2,
    name: "庄子",
    avatar: "",
    philosophy: "逍遥游，齐物论",
    school: "道家"
  },
  {
    id: 3,
    name: "孔子",
    avatar: "",
    philosophy: "仁、义、礼、智、信",
    school: "儒家"
  }
])
const records = ref([])
const loading = ref(false)
const error = ref(null)

// 表单状态
const newRecordTitle = ref('')
const newRecordContent = ref('')
const editingRecordId = ref(null)
const editingRecordNumber = ref(null)

let rotationInterval = null;
let rotation = 0;
let isRotating = ref(true);

// 太极图自动旋转
const startRotation = () => {
  const taichi = document.querySelector('.taichi');
  if (taichi && isRotating.value) {
    rotationInterval = setInterval(() => {
      rotation += 1;
      taichi.style.transform = `rotate(${rotation}deg)`;
    }, 50);
  }
};

// 停止旋转
const stopRotation = () => {
  if (rotationInterval) {
    clearInterval(rotationInterval);
    rotationInterval = null;
  }
};

// 太极图点击事件
const enterSite = () => {
  // 停止旋转
  stopRotation();
  
  // 添加旋转动画
  const taichi = document.querySelector('.taichi')
  if (taichi) {
    taichi.style.transform = 'rotate(360deg)'
    taichi.style.transition = 'transform 1s ease-in-out'
  }
  
  // 延迟切换视图
  setTimeout(() => {
    currentView.value = 'quotes'
    nextTick(() => {
      arrangeCardsInCircle()
    })
  }, 800)
}

// 将卡片排列成圆形
const arrangeCardsInCircle = () => {
  const cards = document.querySelectorAll('.quote-card')
  if (!cards || cards.length === 0) return
  
  const radius = Math.min(window.innerWidth, window.innerHeight) * 0.3
  const centerX = window.innerWidth / 2
  const centerY = window.innerHeight / 2 - 50
  
  cards.forEach((card, index) => {
    const angle = (index * 2 * Math.PI / cards.length) - Math.PI / 2
    const x = centerX + radius * Math.cos(angle)
    const y = centerY + radius * Math.sin(angle)
    
    card.style.left = `${x - card.offsetWidth / 2}px`
    card.style.top = `${y - card.offsetHeight / 2}px`
  })
}

// 触摸开始事件
const handleTouchStart = (event) => {
  const touch = event.touches[0]
  touchStartX.value = touch.clientX
  touchStartY.value = touch.clientY
  touchCount.value = event.touches.length // 记录触摸点数量
}

// 触摸结束事件
const handleTouchEnd = (event) => {
  const touch = event.changedTouches[0]
  touchEndX.value = touch.clientX
  touchEndY.value = touch.clientY
  handleSwipeGesture(event)
}

// 处理滑动手势
const handleSwipeGesture = (event) => {
  const diffX = touchStartX.value - touchEndX.value
  const diffY = touchStartY.value - touchEndY.value
  const absDiffX = Math.abs(diffX)
  const absDiffY = Math.abs(diffY)
  
  // 只有在垂直滑动距离大于水平滑动距离时才触发滑动
  if (absDiffY > absDiffX && absDiffY > 50) {
    // 双指上滑检测
    if (touchCount.value === 2) {
      if (diffY > 0) {
        // 上滑
        switchView('left')
      } else {
        // 下滑
        switchView('right')
      }
    }
  }
}

// 切换视图
const switchView = (direction) => {
  const views = ['quotes', 'sages', 'records']
  const currentIndex = views.indexOf(currentView.value)
  
  if (direction === 'left') {
    if (currentIndex < views.length - 1) {
      currentView.value = views[currentIndex + 1]
      if (currentView.value === 'quotes') {
        nextTick(() => {
          arrangeCardsInCircle()
        })
      }
    }
  } else if (direction === 'right') {
    if (currentIndex > 0) {
      currentView.value = views[currentIndex - 1]
    } else if (currentView.value !== 'taichi') {
      // 如果在第一个视图继续右滑，回到太极图
      currentView.value = 'taichi'
      nextTick(() => {
        startRotation()
      })
    }
  }
}

// 从GitHub获取道的论述
const fetchQuotes = async () => {
  loading.value = true
  error.value = null
  
  try {
    const data = await githubAPI.getQuotes()
    // 如果没有从API获取到数据，则使用默认数据
    if (!data || data.length === 0) {
      quotes.value = getDefaultQuotes()
    } else {
      quotes.value = data
    }
  } catch (err) {
    error.value = '获取数据失败: ' + err.message
    console.error('获取数据失败:', err)
    // 出错时使用默认数据
    quotes.value = getDefaultQuotes()
  } finally {
    loading.value = false
  }
}

// 获取默认的道的论述
const getDefaultQuotes = () => {
  return [
    {
      id: 1,
      number: 1,
      text: "道可道，非常道；名可名，非常名。",
      author: "老子",
      source: "道德经",
      school: "道家",
      votes: { upvotes: 25, downvotes: 2 },
      comments_count: 8,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      number: 2,
      text: "上善若水，水善利万物而不争。",
      author: "老子",
      source: "道德经",
      school: "道家",
      votes: { upvotes: 32, downvotes: 1 },
      comments_count: 12,
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      number: 3,
      text: "天下皆知美之为美，斯恶已；皆知善之为善，斯不善已。",
      author: "老子",
      source: "道德经",
      school: "道家",
      votes: { upvotes: 18, downvotes: 3 },
      comments_count: 6,
      created_at: new Date().toISOString()
    },
    {
      id: 4,
      number: 4,
      text: "至人无己，神人无功，圣人无名。",
      author: "庄子",
      source: "逍遥游",
      school: "道家",
      votes: { upvotes: 20, downvotes: 2 },
      comments_count: 7,
      created_at: new Date().toISOString()
    },
    {
      id: 5,
      number: 5,
      text: "吾生也有涯，而知也无涯。",
      author: "庄子",
      source: "养生主",
      school: "道家",
      votes: { upvotes: 28, downvotes: 4 },
      comments_count: 15,
      created_at: new Date().toISOString()
    }
  ]
}

// 添加记录
const addRecord = async () => {
  if (newRecordTitle.value && newRecordContent.value) {
    try {
      if (editingRecordId.value) {
        // 更新现有记录
        const updatedIssue = await githubAPI.updateIssue(
          editingRecordNumber.value,
          newRecordTitle.value,
          newRecordContent.value
        )
        
        if (updatedIssue) {
          const index = records.value.findIndex(r => r.id === editingRecordId.value)
          if (index !== -1) {
            records.value[index].title = newRecordTitle.value
            records.value[index].content = newRecordContent.value
            records.value[index].date = new Date().toISOString().split('T')[0]
          }
          editingRecordId.value = null
          editingRecordNumber.value = null
        }
      } else {
        // 添加新记录
        const newIssue = await githubAPI.createIssue(
          newRecordTitle.value,
          newRecordContent.value
        )
        
        if (newIssue) {
          const newRecord = {
            id: newIssue.id,
            number: newIssue.number,
            title: newIssue.title,
            content: newIssue.body || '',
            date: newIssue.created_at.split('T')[0]
          }
          records.value.push(newRecord)
        }
      }
      
      // 清空表单
      newRecordTitle.value = ''
      newRecordContent.value = ''
    } catch (err) {
      error.value = '操作失败: ' + err.message
      console.error('操作失败:', err)
    }
  }
}

// 编辑记录
const editRecord = (record) => {
  newRecordTitle.value = record.title
  newRecordContent.value = record.content
  editingRecordId.value = record.id
  editingRecordNumber.value = record.number
}

// 删除记录
const deleteRecord = async (id, number) => {
  try {
    const result = await githubAPI.deleteIssue(number)
    
    if (result) {
      const index = records.value.findIndex(r => r.id === id)
      if (index !== -1) {
        records.value.splice(index, 1)
      }
      
      // 如果正在编辑被删除的记录，清空表单
      if (editingRecordId.value === id) {
        newRecordTitle.value = ''
        newRecordContent.value = ''
        editingRecordId.value = null
        editingRecordNumber.value = null
      }
    }
  } catch (err) {
    error.value = '删除失败: ' + err.message
    console.error('删除失败:', err)
  }
}

// 组件挂载时获取数据并开始旋转
onMounted(() => {
  fetchQuotes()
  startRotation()
  
  // 窗口大小改变时重新排列卡片
  window.addEventListener('resize', arrangeCardsInCircle)
})

// 组件卸载时移除事件监听器
onUnmounted(() => {
  window.removeEventListener('resize', arrangeCardsInCircle)
  if (rotationInterval) {
    clearInterval(rotationInterval)
  }
})
</script>

<template>
  <div id="app" @touchstart="handleTouchStart" @touchend="handleTouchEnd">
    <!-- 太极图首页 -->
    <div v-if="currentView === 'taichi'" class="taichi-view">
      <div class="taichi-wrapper">
        <div 
          class="taichi" 
          @click="enterSite"
          @mouseenter="stopRotation"
          @mouseleave="startRotation"
        >
          <div class="taichi-left"></div>
          <div class="taichi-right"></div>
        </div>
      </div>
    </div>

    <!-- 道的论述卡牌视图 -->
    <div v-else-if="currentView === 'quotes'" class="quotes-view">
      <h1>道的论述</h1>
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <div v-else class="cards-container">
        <div 
          v-for="quote in quotes" 
          :key="quote.id" 
          class="card quote-card"
        >
          <div class="quote-text">"{{ quote.text }}"</div>
          <div class="quote-author">—— {{ quote.author }}</div>
          <div class="quote-source">{{ quote.source }}</div>
          <div class="quote-school">{{ quote.school }}</div>
          <div class="quote-votes">
            <span class="upvotes">👍 {{ quote.votes.upvotes }}</span>
            <span class="downvotes">👎 {{ quote.votes.downvotes }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 得道者介绍视图 -->
    <div v-else-if="currentView === 'sages'" class="sages-view">
      <h1>得道者</h1>
      <div class="cards-container">
        <div 
          v-for="sage in sages" 
          :key="sage.id" 
          class="card sage-card"
        >
          <div class="sage-avatar">{{ sage.name.substring(0, 1) }}</div>
          <div class="sage-name">{{ sage.name }}</div>
          <div class="sage-philosophy">{{ sage.philosophy }}</div>
          <div class="sage-school">{{ sage.school }}</div>
        </div>
      </div>
    </div>

    <!-- 个人修道记录视图 -->
    <div v-else-if="currentView === 'records'" class="records-view">
      <h1>个人修道记录</h1>
      <div v-if="error" class="error">{{ error }}</div>
      <div class="cards-container">
        <div 
          v-for="record in records" 
          :key="record.id" 
          class="card record-card"
        >
          <div class="record-title">{{ record.title }}</div>
          <div class="record-content">{{ record.content }}</div>
          <div class="record-date">{{ record.date }}</div>
          <div class="record-actions">
            <button @click="editRecord(record)" class="edit-btn">编辑</button>
            <button @click="deleteRecord(record.id, record.number)" class="delete-btn">删除</button>
          </div>
        </div>
        
        <!-- 添加/编辑记录的表单 -->
        <div class="card record-form">
          <h2>{{ editingRecordId ? '编辑记录' : '添加新记录' }}</h2>
          <form @submit.prevent="addRecord">
            <div class="form-group">
              <input type="text" v-model="newRecordTitle" placeholder="标题" required>
            </div>
            <div class="form-group">
              <textarea v-model="newRecordContent" placeholder="内容" required></textarea>
            </div>
            <div class="form-actions">
              <button type="submit">{{ editingRecordId ? '更新记录' : '添加记录' }}</button>
              <button 
                v-if="editingRecordId" 
                @click="() => { editingRecordId = null; editingRecordNumber = null; newRecordTitle = ''; newRecordContent = '' }" 
                type="button"
                class="cancel-btn"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
html, body {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  overflow-x: hidden;
}

#app {
  font-family: 'Microsoft YaHei', '微软雅黑', sans-serif;
  text-align: center;
  min-height: 100vh;
  width: 100%;
  background-color: #f5f5f5;
  padding: 0;
  margin: 0;
}

/* 太极图相关样式 */
.taichi-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  height: 100vh;
  width: 100%;
  padding: 0;
  margin: 0;
}

.taichi-wrapper {
  position: relative;
  width: 100vh;
  height: 100vh;
  cursor: pointer;
}

.taichi {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(to right, #000 50%, #fff 50%);
  transform-origin: center;
}

.taichi:hover {
  transform: rotate(90deg);
  transition: transform 0.5s ease-in-out;
}

.taichi::before {
  content: "";
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 50%;
  height: 50%;
  border-radius: 50%;
  background-color: #000;
}

.taichi::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 50%;
  height: 50%;
  border-radius: 50%;
  background-color: #fff;
}

.taichi-left::before {
  content: "";
  position: absolute;
  top: 25%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 25%;
  height: 25%;
  border-radius: 50%;
  background-color: #fff;
}

.taichi-right::before {
  content: "";
  position: absolute;
  top: 75%;
  left: 25%;
  transform: translate(50%, -50%);
  width: 25%;
  height: 25%;
  border-radius: 50%;
  background-color: #000;
  z-index: 2;
}

.click-hint {
  margin-top: 20px;
  font-size: 1.1rem;
  color: #666;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 0.5; }
  50% { opacity: 1; }
  100% { opacity: 0.5; }
}

/* 卡牌布局样式 */
.quotes-view, .sages-view, .records-view {
  padding: 20px;
  height: 100vh;
  box-sizing: border-box;
}

.quotes-view h1, .sages-view h1, .records-view h1 {
  margin-bottom: 30px;
  color: #333;
}

.loading, .error {
  text-align: center;
  padding: 20px;
  font-size: 1.2rem;
}

.error {
  color: #e74c3c;
}

.cards-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: calc(100vh - 100px);
  position: relative;
  pointer-events: none;
}

.card {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  transition: transform 0.3s ease;
  position: absolute;
  width: 250px;
  height: 150px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  pointer-events: auto;
}

.card:hover {
  transform: translateY(-5px);
}

.quote-card {
  min-height: 150px;
}

.quote-text {
  font-size: 1rem;
  font-style: italic;
  margin-bottom: 10px;
  line-height: 1.4;
  text-align: center;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.quote-author {
  font-weight: bold;
  color: #333;
  margin-top: auto;
  font-size: 0.9rem;
}

.quote-source {
  font-size: 0.8rem;
  color: #666;
}

.quote-school {
  display: inline-block;
  background: #e0e0e0;
  padding: 3px 6px;
  border-radius: 12px;
  font-size: 0.7rem;
  margin-top: 5px;
}

.quote-votes {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #eee;
  width: 100%;
}

.sage-card {
  text-align: center;
}

.sage-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #3498db;
  color: white;
  font-size: 2rem;
  line-height: 80px;
  margin: 0 auto 15px;
}

.sage-name {
  font-size: 1.3rem;
  font-weight: bold;
  margin-bottom: 10px;
}

.sage-philosophy {
  font-style: italic;
  color: #555;
  margin-bottom: 10px;
  font-size: 0.9rem;
}

.sage-school {
  display: inline-block;
  background: #e0e0e0;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
}

.record-card {
  min-height: 150px;
}

.record-title {
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 10px;
}

.record-content {
  text-align: left;
  line-height: 1.5;
  margin-bottom: 15px;
}

.record-date {
  font-size: 0.8rem;
  color: #999;
  text-align: right;
}

.record-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
}

.record-actions button {
  padding: 5px 10px;
  font-size: 0.9rem;
}

.edit-btn {
  background: #f39c12;
}

.delete-btn {
  background: #e74c3c;
}

.record-form {
  min-height: 250px;
  display: flex;
  flex-direction: column;
}

.record-form h2 {
  margin-bottom: 15px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
}

.form-group textarea {
  min-height: 80px;
  resize: vertical;
}

.form-actions {
  display: flex;
  gap: 10px;
}

.form-actions button {
  flex: 1;
}

.cancel-btn {
  background: #95a5a6;
}

button {
  padding: 10px 20px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

button:hover {
  background: #2980b9;
}
</style>