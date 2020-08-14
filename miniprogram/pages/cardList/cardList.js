//cardlist.js
const app = getApp()
import Dialog from '../../miniprogram_npm/@vant/weapp/dialog/dialog'
import Notify from '../../miniprogram_npm/@vant/weapp/notify/notify';
Page({
  data: {
    openid: '',
    cardList: [],
    popupShow: false,
    popupShowDetail: false,
    sendCloud: true,
    checkOrg: true,
    formData: {},
    today: 0,
    payDay: '',     //还款日
    limit: '',      //额度
    cvv: '',        //CVV
    validity: '',   //有效期
    cardInfo: {
      bankIcon: '',//银行图标
      cardNo: '',  //卡号
      cardType: '',//卡类型 借记卡 or 信用卡
      orgIcon: '', //卡组织图标
      cardOrg: '', //卡组织
    },
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
      popupShow: true
    })
  },
  handleDelete() {
    Dialog.confirm({
      message: '确认删除',
      asyncClose: true
    }).then(() => {
      this.doDelete(this.data.cardInfo)
    }).catch(() => {
      Dialog.close();
    });
  },
  doDelete(params) {
    const db = wx.cloud.database()
    // 查询当前用户所有的 card_list
    db.collection('card_list').where({
      _id: params._id
    }).remove({
      success: res => {
        Notify({ type: 'success', duration: 1000, message: '已删除' })
        Dialog.close()
        this.onPopupClose()
        this.doQuery()
        console.log('[数据库] [删除记录] 成功: ', res)
      },
      fail: err => {
        Notify({ type: 'danger', duration: 1000, message: '删除失败' })
        console.error('[数据库] [查询记录] 失败：', err)
      }
    })
  },
  handleDetail(e) {
    const row = e.currentTarget.dataset.row
    const {payDay,limit,cvv,validity}=row
    this.setData({
      popupShowDetail: true,
      cardInfo: row,
      payDay,
      limit,
      cvv,
      validity,
    })

  },
  onPopupClose() {
    this.setData({
      popupShow: false,
      popupShowDetail: false,
    })
    setTimeout(() => {
      this.setData({
        cardInfo:{},
      })
    }, 100);
  },

  getBankInfo(event) {
    console.log(event)
    this.setData({
      'cardInfo.cardNo': event.detail,
      'cardInfo.showCardNo': event.detail.replace(/\s/g,'').replace(/[^\d]/g,'').replace(/(\d{4})(?=\d)/g,'$1 ')
    })
    if (event.detail.length > 5 && this.data.sendCloud) {
      // 调用云函数
      wx.cloud.callFunction({
        name: 'bankinfo',
        data: {
          cardNo: event.detail
        },
        success: res => {
          console.log('[云函数] [bankinfo] : ', res.result)
          if (res.result.bankCode != 400) {
            this.setData({
              'cardInfo.bankIcon': `../../images/icon-bank/${res.result.bankCode}.png`,
              'cardInfo.cardType':res.result.cardType,
              'cardInfo.cardTypeName':res.result.cardTypeName,
              'cardInfo.bankCode':res.result.bankCode,
              'cardInfo.bankName':res.result.bankName,
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
            'checkOrg': false,
            'cardInfo.cardOrg': 'visa',
            'cardInfo.orgIcon': '../../images/icon-bank/card-org/card-visa.png',
          })
          break;
        case '5':
          this.setData({
            'checkOrg': false,
            'cardInfo.cardOrg': 'master',
            'cardInfo.orgIcon': '../../images/icon-bank/card-org/card-master.png',
          })
          break;
        case '6':
          this.setData({
            'checkOrg': false,
            'cardInfo.cardOrg': 'unionpay',
            'cardInfo.orgIcon': '../../images/icon-bank/card-org/card-unionpay.png',
          })
          break;
        default:
          this.setData({
            'cardInfo.orgIcon': '',
            'checkOrg': false
          })
          break;
      }
    }
    if (event.detail.length === 0) {
      this.setData({
        'cardInfo': {},
        'checkOrg': true,
        'sendCloud': true
      })
    }
  },
  clearBankInfo() {
    this.setData({
      'cardInfo': {},
    })
  },
  formSubmit() {
    this.setData({
      'cardInfo.payDay': this.data.payDay,
      'cardInfo.limit': this.data.limit,
      'cardInfo.cvv': this.data.cvv,
      'cardInfo.validity': this.data.validity,
    })
    this.doAdd( this.data.cardInfo) //添加到数据库
  },
  doAdd: function (params) {
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
        Notify({ type: 'success', duration: 1000, message: '新增成功' })
        this.setData({
          popupShow: false
        })
        this.doQuery()
        console.log('[数据库] [新增记录] 成功，记录 _id: ', res._id)
      },
      fail: err => {
        Notify({ type: 'danger', duration: 1000, message: '新增失败' })
        console.error('[数据库] [新增记录] 失败：', err)
      }
    })
  },

  doQuery: function () {
    const db = wx.cloud.database()
    // 查询当前用户所有的 card_list
    db.collection('card_list').where({
      _openid: this.data.openid
    }).get({
      success: res => {
        res.data.map(item => {
          item.cardNoFormat = item.cardNo.replace(/^(\d{4})\d+(\d{4})$/, "$1 **** **** $2");
        })
        this.setData({
          cardList: res.data
          // cardList: []
        })
        console.log('[数据库] [查询记录] 成功: ', res)
      },
      fail: err => {
        Notify({ type: 'danger', duration: 1000, message: '查询失败' })
        console.error('[数据库] [查询记录] 失败：', err)
      }
    })
  },
  copyCardNo(e) {
    wx.setClipboardData({ data: e.currentTarget.dataset.cardno})
    // wx.setClipboardData({
    //   data: e.currentTarget.dataset.cardno,
    //   success: function (res) {
    //     wx.getClipboardData({
    //       success: function (res) {
    //         Notify({ type: 'success', duration: 1000, message: '已复制' })
    //       }
    //     })
    //   }
    // })
  }
})