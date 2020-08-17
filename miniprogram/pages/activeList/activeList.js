//activityList.js
const app = getApp()

Page({
  data: {
    openid: '',
    bankName: '选择活动方',
    bankCode:'',
    name: '',
    content: '',
    time: '',
    remake: '',
    activityList:[],
    columns: [
      { text: '中国银行', value: 'BOC' },
      { text: '工商银行', value: 'ICBC' },
      { text: '建设银行', value: 'CCB' },
      { text: '浦发银行', value: 'SPDB' },
      { text: '招商银行', value: 'CMB' },
      { text: '广发银行', value: 'GF' },
      { text: '微信', value: 'WX' },
      { text: '支付宝', value: 'ZFB' },
      { text: '其他', value: 'OTHER' },
      // { text: '农业银行', disabled: true },
    ],
    isShowPopup: false,
    isShowBankPopup: false,
    showPopupDetail: false,
    isEdit: false,

  },
  onLoad: function () {
    if (app.globalData.openid) {
      this.setData({
        openid: app.globalData.openid
      })
    }
    this.setData({
      today: new Date().getUTCDate().toString()
    })
    this.doQuery()
  },
  handleAdd() {
    this.setData({
      isShowPopup: true
    })
  },
  onBankPopup() {
    this.setData({
     isShowBankPopup: true
    })
  },
  onBankPickerConfirm(event) {
    const { picker, value, index } = event.detail;
    console.log(event.detail)
    this.setData({
      isShowBankPopup: false,
      bankName:value.text,
      bankCode:value.value,
     })
  },
  // handleDetail(e) {
  //   this.setData({
  //     isShowPopup: true
  //   })
  //   console.log(e.currentTarget.dataset)
  // },
  onPopupClose() {
    this.setData({
      isShowPopup: false
    })
  },
  onBankPopupClose() {
    this.setData({
      isShowBankPopup: false
    })
  },
  
  formSubmit() {
    const {
      bankName,
      bankCode,
      name,
      content,
      time,
      remake,
    } = this.data

    this.doAdd({
      bankName,
      bankCode,
      name,
      content,
      time,
      remake,
    }) //添加到数据库
  },
  doAdd: function (params) {
    const db = wx.cloud.database()
    db.collection('activity_list').add({
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
          isShowPopup: false
        })
        this.doQuery()
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

  doQuery: function () {
    const db = wx.cloud.database()
    // 查询当前用户所有的 card_list
    db.collection('activity_list').where({
      _openid: this.data.openid
    }).get({
      success: res => {
        this.setData({
          activityList: res.data
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

})