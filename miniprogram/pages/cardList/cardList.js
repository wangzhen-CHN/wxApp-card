//cardlist.js
const app = getApp()

Page({
  data: {
    openid: '',
    cardList: [],
    popupShow: false,
    sendCloud: true,
    checkOrg: true,
    orgIcon: '',
    cardOrg: '', //卡组织
    bankInfo: {},
    bankIcon: '',
    cardNo: '**** **** **** ****',
    billday: '*', //账单日
    payDay: '', //还款日
    limit: '', //额度
    remake: '',
    lastTapTime:0,

  },
  onLoad: function () {
    if (app.globalData.openid) {
      this.setData({
        openid: app.globalData.openid
      })
    }
    this.onQuery()
  },
  handleAdd() {
    this.setData({
      popupShow: true
    })
  },
  onPopupClose() {
    this.setData({
      popupShow: false
    })
  },
  getBillDay(event) {
    this.setData({
      'billday': event.detail.length === 0 ? '*' : event.detail
    })
  },
  getPayDay(event) {
    this.setData({
      'payDay': event.detail
    })
  },
  getLimit(event) {
    this.setData({
      'limit': event.detail
    })
  },
  getRemake(event) {
    this.setData({
      'remake': event.detail
    })
  },
  getBankInfo(event) {
    this.setData({
      'cardNo': event.detail
    })
    if (event.detail.length > 5 && this.data.sendCloud) {
      // 调用云函数
      wx.cloud.callFunction({
        name: 'bankinfo',
        data: {
          cardNo: event.detail
        },
        success: res => {
          console.log('[云函数] [bankinfo] : ', `../../images/icon-bank/${res.result.bankCode}.png`)
          if (res.result.bankCode != 400) {
            this.setData({
              'bankIcon': `../../images/icon-bank/${res.result.bankCode}.png`,
              'bankInfo': res.result
            })
          }
        },
        fail: err => {
          console.error('[云函数] [bankinfo] 调用失败', err)
        }
      })
      this.setData({
        'sendCloud': false
      })
    }
    if (event.detail.length > 0 && this.data.checkOrg) {
      const orgNo = event.detail.slice(0, 1)
      switch (orgNo) {
        case '4':
          this.setData({
            'cardOrg': 'visa',
            'orgIcon': '../../images/icon-bank/card-org/card-visa.png'
          })
          break;
        case '5':
          this.setData({
            'cardOrg': 'master',
            'orgIcon': '../../images/icon-bank/card-org/card-master.png'
          })
          break;
        case '6':
          this.setData({
            'cardOrg': 'unionpay',
            'orgIcon': '../../images/icon-bank/card-org/card-unionpay.png'
          })
          break;
        default:
          this.setData({
            'orgIcon': ''
          })
          break;
      }
      this.setData({
        'checkOrg': false
      })
    }
    if (event.detail.length === 0) {
      this.setData({
        'sendCloud': true,
        'checkOrg': true,
        'orgIcon': '',
        'cardNo': '**** **** **** ****',
      })
    }
  },
  formSubmit() {
    const {
      cardOrg,
      cardNo,
      billday,
      payDay,
      limit,
      bankInfo,
      remake
    } = this.data
    const cardInfo = {
      cardOrg,
      cardNo,
      billday,
      payDay,
      limit,
      bankInfo,
      remake
    }
    // console.log('form发生了submit事件，携带数据为：', cardInfo)
    this.onAdd(cardInfo) //添加到数据库
  },
  onAdd: function (params) {
    const db = wx.cloud.database()
    db.collection('card_list').add({
      data: {
        ...params
      },
      success: res => {
        // 在返回结果中会包含新创建的记录的 _id
        this.setData({
          counterId: res._id,
          count: 1
        })
        wx.showToast({
          title: '新增记录成功',
        })
        this.setData({
          popupShow: false
        })
        this.onQuery()
        console.log('[数据库] [新增记录] 成功，记录 _id: ', res._id)
      },
      fail: err => {
        wx.showToast({
          icon: 'none',
          title: '新增记录失败'
        })
        console.error('[数据库] [新增记录] 失败：', err)
      }
    })
  },

  onQuery: function () {
    const db = wx.cloud.database()
    // 查询当前用户所有的 card_list
    db.collection('card_list').where({
      _openid: this.data.openid
    }).get({
      success: res => {
        this.setData({
          cardList: res.data
        })
        console.log('[数据库] [查询记录] 成功: ', res)
      },
      fail: err => {
        wx.showToast({
          icon: 'none',
          title: '查询记录失败'
        })
        console.error('[数据库] [查询记录] 失败：', err)
      }
    })
  },
  doubleClick: function (e) {
    console.log(e)
    var curTime = e.timeStamp
    var lastTime = e.currentTarget.dataset.time  // 通过e.currentTarget.dataset.time 访问到绑定到该组件的自定义数据
    if (curTime - lastTime > 0) {
      if (curTime - lastTime < 300) {//是双击事件
        wx.setClipboardData({
          data: e.currentTarget.dataset.cardno,
          success: function (res) {
            wx.getClipboardData({
              success: function (res) {
                wx.showToast({
                  title: '复制成功'
                })
              }
            })
          }
        })
        console.log(e.currentTarget.dataset.cardno)
      }
    }
    this.setData({
      lastTapTime: curTime
    })
  },
})