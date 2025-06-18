// API 配置文件
export const BASE_URL = 'https://api.nekowalker.cn'; // 使用代理路径，由vite代理转发到后端服务


// 更新request函数
const request = (options) => {
  // 只在token真正过期时才拦截（不是快过期）
  if (!options.url.includes('/login')) {
    const token = uni.getStorageSync('token');
    const expiryTime = uni.getStorageSync('tokenExpiry');
    const now = Date.now();
    
    // 只有当token不存在或者已经过期时才拦截
    if (!token || !expiryTime || now >= parseInt(expiryTime)) {
      clearUserData();
      showReloginModal();
      return Promise.reject(new Error('Token已过期'));
    }
  }
  
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token');
    
    // 处理GET请求的参数
    let requestUrl = BASE_URL + options.url;
    let requestData = options.data || {};
    
    // 如果是GET请求且有参数，将参数添加到URL查询字符串中
    if ((options.method || 'GET').toUpperCase() === 'GET' && Object.keys(requestData).length > 0) {
      const queryParams = new URLSearchParams();
      Object.keys(requestData).forEach(key => {
        if (requestData[key] !== undefined && requestData[key] !== null) {
          queryParams.append(key, requestData[key]);
        }
      });
      requestUrl += '?' + queryParams.toString();
      requestData = {}; // GET请求不需要body数据
    }
    
    uni.request({
      url: requestUrl,
      method: options.method || 'GET',
      data: requestData,
      header: {
        'Content-Type': 'application/json',
        ...(token && !options.url.includes('/login') ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.header
      },
      success: (res) => {
        console.log('API响应:', {
          url: requestUrl,
          method: options.method || 'GET',
          statusCode: res.statusCode,
          data: res.data
        });
        
        if (res.statusCode === 200) {
          resolve(res.data);
        } else if (res.statusCode === 401 || res.statusCode === 403) {
          // Token过期或无权限
          clearUserData();
          uni.showToast({
            title: '登录已过期，请重新登录',
            icon: 'none',
            duration: 2000
          });
          setTimeout(() => {
            showReloginModal();
          }, 2000);
          reject(new Error('认证失败'));
        } else {
          uni.showToast({
            title: res.data.message || '请求失败',
            icon: 'none'
          });
          reject(new Error(res.data.message || '请求失败'));
        }
      },
      fail: (err) => {
        uni.showToast({
          title: '网络错误',
          icon: 'none'
        });
        reject(err);
      }
    });
  });
};

// 更新登录方法，保存token过期时间
export const authApi = {
  studentLogin: (data) => {
    return request({
      url: '/api/student/login',
      method: 'POST',
      data
    }).then(response => {
      if (response.token) {
        // 保存token和过期时间（24小时后过期）
        const expiryTime = Date.now() + 24 * 60 * 60 * 1000;
        uni.setStorageSync('token', response.token);
        uni.setStorageSync('tokenExpiry', expiryTime.toString());
        
        if (response.student) {
          uni.setStorageSync('userInfo', response.student);
        }
      }
      return response;
    });
  }
};


// 用户信息及积分相关API
// 在 userApi 中添加或修改 getTeacherInfo 方法
export const userApi = {
  // 获取学生个人信息
  getStudentProfile: () => {
    const token = uni.getStorageSync('token');
    return request({ 
      url: '/api/student/profile',
      header: {
        'Authorization': `Bearer ${token}`
      }
    });
  },
  
  // 学生打卡
  clockIn: () => {
    const token = uni.getStorageSync('token');
    return request({ 
      url: '/api/student/clock-in', 
      method: 'POST',
      header: {
        'Authorization': `Bearer ${token}`
      }
    });
  },
  
  // 学生签到
  checkin: () => {
    const token = uni.getStorageSync('token');
    return request({ 
      url: '/api/student/checkin', 
      method: 'POST',
      header: {
        'Authorization': `Bearer ${token}`
      }
    });
  },
  
  // 检查课程购买状态
  checkCoursePurchased: (courseId) => request({
    url: `/api/student/course/purchased/${courseId}`,
    method: 'GET'
  }),
  
  // 购买课程
  purchaseCourse: (data) => request({
    url: '/api/student/course/purchase',
    method: 'POST',
    data
  }),
  
  // 获取购买的课程列表
  getPurchasedCourses: (params) => request({
    url: '/api/student/courses',
    method: 'GET',
    data: params
  }),
  
  // 保留原有的模拟方法作为备用
  getProfile: () => {
    return Promise.resolve(uni.getStorageSync('userInfo') || { nickname: '模拟用户', id: '007', avatarUrl: '' });
  },
  getPointsSummary: () => {
    return Promise.resolve({ daily: Math.floor(Math.random() * 100), total: 450 + Math.floor(Math.random() * 50) });
  },
  signIn: () => request({ url: '/user/signin', method: 'POST' }),
  
  // 获取教师信息
  getTeacherInfo: (teacherId) => request({
    url: `/api/teacher/${teacherId}`,
    method: 'GET'
  }),
  
  // 购物车相关API
  // 添加到购物车
  addToCart: (data) => request({
    url: '/api/cart/add',
    method: 'POST',
    data
  }),
  
  // 获取购物车列表
  getCartList: (stuId) => request({
    url: `/api/cart/list?stuId=${stuId}`,
    method: 'GET'
  }),
  
  // 从购物车移除单个课程
  removeFromCart: (stuId, couId) => request({
    url: `/api/cart/remove?stuId=${stuId}&couId=${couId}`,
    method: 'DELETE'
  }),
  
  // 批量移除购物车课程
  batchRemoveFromCart: (data) => request({
    url: '/api/cart/remove-batch',
    method: 'DELETE',
    data
  }),
  
  // 清空购物车
  clearCart: (stuId) => request({
    url: `/api/cart/clear?stuId=${stuId}`,
    method: 'DELETE'
  }),
  
  // 检查课程是否在购物车中
  checkInCart: (stuId, couId) => request({
    url: `/api/cart/check?stuId=${stuId}&couId=${couId}`,
    method: 'GET'
  }),
  
  // 获取购物车数量
  getCartCount: (stuId) => request({
    url: `/api/cart/count?stuId=${stuId}`,
    method: 'GET'
  }),
  
  // 购物车结算
  checkoutCart: (data) => request({
    url: '/api/cart/checkout',
    method: 'POST',
    data
  }),
  
  // 收藏相关API
  // 添加收藏
  addCollection: (stuId, couId) => request({
    url: `/api/student/collection/add?stuId=${stuId}&couId=${couId}`,
    method: 'POST'
  }),
  
  // 取消收藏
  removeCollection: (stuId, couId) => request({
    url: `/api/student/collection/remove?stuId=${stuId}&couId=${couId}`,
    method: 'DELETE'
  }),
  
  // 检查收藏状态
  checkCollectionStatus: (stuId, couId) => request({
    url: `/api/student/collection/check?stuId=${stuId}&couId=${couId}`,
    method: 'GET'
  }),
  
  // 获取收藏列表
  getCollectionList: (stuId) => request({
    url: `/api/student/collection/list/${stuId}`,
    method: 'GET'
  }),
  
  // 点赞相关API
  // 添加点赞
  addFancy: (stuId, couId) => request({
    url: `/api/student/fancy/add?stuId=${stuId}&couId=${couId}`,
    method: 'POST'
  }),
  
  // 取消点赞
  removeFancy: (stuId, couId) => request({
    url: `/api/student/fancy/remove?stuId=${stuId}&couId=${couId}`,
    method: 'DELETE'
  }),
  
  // 检查点赞状态
  checkFancyStatus: (stuId, couId) => request({
    url: `/api/student/fancy/check?stuId=${stuId}&couId=${couId}`,
    method: 'GET'
  }),
  
  // 获取点赞列表
  getFancyList: (stuId) => request({
    url: `/api/student/fancy/list/${stuId}`,
    method: 'GET'
  }),
  
  // 获取课程点赞数量
  getFancyCount: (couId) => request({
    url: `/api/student/fancy/count/${couId}`,
    method: 'GET'
  }),
  
  // 获取课程收藏数量
  getCollectionCount: (couId) => request({
    url: `/api/student/collection/count/${couId}`,
    method: 'GET'
  }),
  
  // 订单相关API
  // 获取订单列表
  getOrderList: (stuId) => request({
    url: `/api/student/order/list/${stuId}`,
    method: 'GET'
  }),
  
  // 获取订单详情
  getOrderDetail: (orderId) => request({
    url: `/api/student/order/detail/${orderId}`,
    method: 'GET'
  }),
  
  // 获取订单列表（包含概要信息）
  getOrderListWithSummary: (stuId) => request({
    url: `/api/student/order/list-with-summary/${stuId}`,
    method: 'GET'
  }),
  
  // 获取已购买的课程列表
  getPurchasedCourses: (stuId) => request({
    url: `/api/student/order/purchased-courses/${stuId}`,
    method: 'GET'
  }),
  
  // 获取用户信息（兼容性方法）
  getUserProfile: () => request({
    url: '/api/student/profile',
    method: 'GET'
  }),
};

// 课程相关API
// 课程相关API
export const courseApi = {
  // 获取课程列表
  getCourseList: (params) => request({
    url: '/api/course/list',
    method: 'GET',
    data: params
  }),
  
  // 获取课程详情
  getCourseById: (id) => request({
    url: `/api/course/${id}`,
    method: 'GET'
  }),
  
  // 添加 getCourseDetail 方法
  getCourseDetail: (id) => request({
    url: `/api/course/${id}`,
    method: 'GET'
  }),
  
  // 获取课程详情信息（包含学生状态）
  getCourseDetailInfo: (courseId, stuId) => request({
    url: `/api/course/detail/${courseId}?stuId=${stuId}`,
    method: 'GET'
  }),
  
  getCourseTypes: () => request({
    url: '/api/course-type/tree',
    method: 'GET'
  }),
  
  // 搜索课程
  searchCourses: (params) => request({
    url: '/api/course/search',
    method: 'GET',
    data: params
  }),
  
  // 获取热门搜索
  getHotSearches: () => request({
    url: '/api/course/hot-searches',
    method: 'GET'
  }),
  
  // 获取推荐课程
  getRecommendedCourses: (params) => request({
    url: '/api/course/recommended',
    method: 'GET',
    data: params
  })
};

// 章节相关API
export const chapterApi = {
  // 获取章节列表
  getChapterList: (courseId) => request({
    url: `/api/chapter/list/${courseId}`,
    method: 'GET'
  }),
  
  // 获取课程章节
  getCourseChapters: (courseId) => request({
    url: `/api/chapter/list/${courseId}`,  // 修改：使用list接口
    method: 'GET'
  }),
  
  // 获取章节详情
  getChapterDetail: (chapterId) => request({
    url: `/api/chapter/${chapterId}`,
    method: 'GET'
  })
};

// 班级相关API
export const classApi = {
  getUserClasses: () => request({ url: '/class/my' }),
  getCoursesByClassId: (classId) => request({ url: `/class/${classId}/courses` }),
  
  // 获取学生所在的班级列表
  getStudentClasses: (stuId) => request({
    url: `/api/student/student-class/student/${stuId}`,
    method: 'GET'
  }),
  
  // 获取班级课程列表
  getClassCourses: (classId) => request({
    url: `/api/class/${classId}/courses`,
    method: 'GET'
  }),
  
  // 获取学生的所有班级课程
  getStudentClassCourses: (stuId) => request({
    url: `/api/student/student-class/courses/${stuId}`,
    method: 'GET'
  })
};

// 将request也导出，方便在特殊情况下直接使用
export default request;

// 移除这行重复导出
// export { request, authApi, courseApi, chapterApi, userApi };

// 在文件开头添加token检查函数
function checkTokenExpiry() {
  const token = uni.getStorageSync('token');
  const tokenExpiry = uni.getStorageSync('tokenExpiry');
  
  if (!token || !tokenExpiry) {
    return false;
  }
  
  const now = Date.now();
  const expiryTime = parseInt(tokenExpiry);
  
  // 只要token还没过期就返回true
  return expiryTime > now;
}

// 清除用户信息和token
function clearUserData() {
  uni.removeStorageSync('token');
  uni.removeStorageSync('tokenExpiry');
  uni.removeStorageSync('userInfo');
}

// 显示重新登录提示
function showReloginModal() {
  uni.showModal({
    title: '登录已过期',
    content: '您的登录已过期，请重新登录',
    showCancel: false,
    confirmText: '重新登录',
    success: () => {
      uni.reLaunch({
        url: '/pages/login/login'
      });
    }
  });
}

// 在现有的 chapterApi 后面添加评价相关API
export const appraiseApi = {
  // 获取课程评价列表
  getCourseAppraises: (courseId) => request({
    url: `/api/student-course-appraise/course/${courseId}`,
    method: 'GET'
  }),
  
  // 获取课程评价统计
  getCourseAppraiseStatistics: (courseId) => request({
    url: `/api/student-course-appraise/course/${courseId}/statistics`,
    method: 'GET'
  }),
  
  // 获取我对某课程的评价
  getMyAppraiseForCourse: (courseId) => request({
    url: `/api/student-course-appraise/student-course?couId=${courseId}`,
    method: 'GET'
  }),
  
  // 提交课程评价
  submitAppraise: (data) => request({
    url: '/api/student-course-appraise/submit',
    method: 'POST',
    data
  }),
  
  // 获取我的所有评价
  getMyAppraises: () => request({
    url: '/api/student-course-appraise/my',
    method: 'GET'
  })
};

// 获取我的评价列表
export const getMyAppraisals = () => {
  return request({
    url: '/appraisal/my',
    method: 'GET'
  });
};

// 教师相关API
export const teacherApi = {
  // 获取教师列表
  getTeacherList: (params = {}) => {
    return request({
      url: '/api/teacher/list',
      method: 'GET',
      data: params
    });
  },
  
  // 根据ID获取教师详情
  getTeacherById: (id) => {
    return request({
      url: `/api/teacher/${id}`,
      method: 'GET'
    });
  }
};

// 资讯相关API
export const informationApi = {
  // 获取资讯列表
  getInformationList: (params = {}) => {
    return request({
      url: '/api/information/list',
      method: 'GET',
      data: params
    });
  },
  
  // 根据ID获取资讯详情
  getInformationById: (id) => {
    return request({
      url: `/api/information/${id}`,
      method: 'GET'
    });
  },
  
  // 搜索资讯
  searchInformation: (keyword, params = {}) => {
    return request({
      url: '/api/information/search',
      method: 'GET',
      data: {
        keyword,
        ...params
      }
    });
  },
  
  // 点赞资讯
  likeInformation: (infoId, stuId) => {
    return request({
      url: `/api/information/${infoId}/like`,
      method: 'POST',
      data: { stuId }
    });
  },
  
  // 取消点赞资讯
  unlikeInformation: (infoId, stuId) => {
    return request({
      url: `/api/information/${infoId}/unlike`,
      method: 'POST',
      data: { stuId }
    });
  },
  
  // 收藏资讯
  collectInformation: (infoId, stuId) => {
    return request({
      url: `/api/information/${infoId}/collect`,
      method: 'POST',
      data: { stuId }
    });
  },
  
  // 取消收藏资讯
  uncollectInformation: (infoId, stuId) => {
    return request({
      url: `/api/information/${infoId}/uncollect`,
      method: 'POST',
      data: { stuId }
    });
  },
  
  // 获取资讯评论列表
  getCommentsByInfoId: (infoId, params = {}) => {
    return request({
      url: `/api/information/${infoId}/comments`,
      method: 'GET',
      data: params
    });
  },
  
  // 创建评论
  createComment: (infoId, data) => {
    return request({
      url: `/api/information/${infoId}/comments`,
      method: 'POST',
      data
    });
  },
  
  // 删除评论
  deleteComment: (commentId) => {
    return request({
      url: `/api/information/comments/${commentId}`,
      method: 'DELETE'
    });
  },
  
  // 点赞评论
  likeComment: (commentId, stuId) => {
    return request({
      url: `/api/information/comments/${commentId}/like`,
      method: 'POST',
      data: { stuId }
    });
  },
  
  // 取消点赞评论
  unlikeComment: (commentId, stuId) => {
    return request({
      url: `/api/information/comments/${commentId}/like`,
      method: 'POST',
      data: { stuId }
    });
  }
};

// 实践相关API
export const practiceApi = {
  // 获取学生的实践列表 - 使用后端StudentPracticeController
  getStudentPracticeList: (stuId, params = {}) => {
    return request({
      url: `/api/student-practice/student/${stuId}`,
      method: 'GET',
      data: params
    });
  },
  
  // 获取实践详情 - 使用后端PracticeController
  getPracticeById: (id) => {
    return request({
      url: `/api/practice/${id}`,
      method: 'GET'
    });
  },
  
  // 学生参与实践 - 使用后端StudentPracticeController
  joinPractice: (practiceId, stuId) => {
    return request({
      url: `/api/student-practice`,
      method: 'POST',
      data: { 
        practiceId: practiceId,
        studentId: stuId,
        joinTime: new Date().toISOString()
      }
    });
  },
  
  // 检查学生是否已参与实践 - 使用后端StudentPracticeController
  checkStudentPractice: (studentId, practiceId) => {
    return request({
      url: `/api/student-practice/check/${studentId}/${practiceId}`,
      method: 'GET'
    });
  },
  
  // 获取学生特定实践记录 - 使用后端StudentPracticeController
  getStudentPracticeRecord: (studentId, practiceId) => {
    return request({
      url: `/api/student-practice/student/${studentId}/practice/${practiceId}`,
      method: 'GET'
    });
  },
  
  // 更新学生实践记录（如提交报告）- 使用后端StudentPracticeController
  updateStudentPractice: (data) => {
    return request({
      url: `/api/student-practice`,
      method: 'PUT',
      data
    });
  }
};

export const questionApi = {
  // 获取问题列表
  getQuestionList: (params = {}) => {
    return request({
      url: '/api/topic-question/list',
      method: 'GET',
      params: params
    });
  },
  
  // 获取问题详情
  getQuestionById: (id) => {
    return request({
      url: `/api/topic-question/${id}`,
      method: 'GET'
    });
  },
  
  // 创建问题
  createQuestion: (data) => {
    return request({
      url: '/api/topic-question',
      method: 'POST',
      data
    });
  },
  
  // 更新问题
  updateQuestion: (id, data) => {
    return request({
      url: `/api/topic-question/${id}`,
      method: 'PUT',
      data
    });
  },
  
  // 删除问题
  deleteQuestion: (id) => {
    return request({
      url: `/api/topic-question/${id}`,
      method: 'DELETE'
    });
  },
  
  // 点赞问题
  likeQuestion: (id) => {
    return request({
      url: `/api/topic-question/${id}/like`,
      method: 'POST'
    });
  },
  
  // 收藏问题
  collectQuestion: (id) => {
    return request({
      url: `/api/topic-question/${id}/collect`,
      method: 'POST'
    });
  },
  
  // 取消收藏问题
  uncollectQuestion: (id) => {
    return request({
      url: `/api/topic-question/${id}/collect`,
      method: 'DELETE'
    });
  },
  
  // 获取问题类型列表
  getQuestionTypes: () => {
    return request({
      url: '/api/topic-question/types',
      method: 'GET'
    });
  },
  
  // 获取问题评论列表
  getQuestionComments: (questionId, params = {}) => {
    return request({
      url: `/api/topic-question/${questionId}/comments`,
      method: 'GET',
      data: params
    });
  },
  
  // 创建问题评论
  createQuestionComment: (questionId, data) => {
    return request({
      url: `/api/topic-question/${questionId}/comments`,
      method: 'POST',
      data
    });
  },
  
  // 删除问题评论
  deleteQuestionComment: (commentId) => {
    return request({
      url: `/api/topic-question/comments/${commentId}`,
      method: 'DELETE'
    });
  },
  
  // 获取评论回复
  getCommentReplies: (commentId, params = {}) => {
    return request({
      url: `/api/topic-question/comments/${commentId}/replies`,
      method: 'GET',
      data: params
    });
  },
  
  // 获取问题图片
  getQuestionImages: (questionId) => {
    return request({
      url: `/api/topic-question/${questionId}/images`,
      method: 'GET'
    });
  },
  
  // 采纳问题
  adoptQuestion: (id) => {
    return request({
      url: `/api/topic-question/${id}/adopt`,
      method: 'PUT'
    });
  },
  
  // 获取学生的问题列表
  getStudentQuestions: (studentId, params = {}) => {
    return request({
      url: `/api/topic-question/student/${studentId}`,
      method: 'GET',
      data: params
    });
  },
  
  // 获取班级的问题列表
  getClassQuestions: (classId, params = {}) => {
    return request({
      url: `/api/topic-question/class/${classId}`,
      method: 'GET',
      data: params
    });
  }
};