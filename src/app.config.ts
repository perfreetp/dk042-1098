export default defineAppConfig({
  pages: [
    'pages/evaluate/index',
    'pages/batch/index',
    'pages/records/index',
    'pages/profile/index',
    'pages/collector/index',
    'pages/order-detail/index',
    'pages/withdraw/index',
    'pages/price-notice/index',
    'pages/faq/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: '绿书回收',
    navigationBarTextStyle: 'black',
    backgroundColor: '#f8faf9'
  },
  tabBar: {
    color: '#9ca3af',
    selectedColor: '#22c55e',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/evaluate/index',
        text: '估价'
      },
      {
        pagePath: 'pages/batch/index',
        text: '批量'
      },
      {
        pagePath: 'pages/records/index',
        text: '记录'
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的'
      }
    ]
  }
})
