//logs.js


Page({
  data: {
    popupShow: false
  },
  handleAdd(){
    this.setData({popupShow:true})
  },
  onPopupClose(){
    this.setData({popupShow:false})
  }

})
