const puppeteer = require('puppeteer');
const list = require('./list');
const fs = require('fs');
async function wait(sec){
  return new Promise(res => {
    setTimeout(res,sec*1e3);
  })
}
async function init(){
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  async function run(igUsername) {
    await page.goto('https://instagram.com/'+igUsername);
    const followersCount = await page.evaluate(() => {
      return _sharedData.entry_data.ProfilePage[0].graphql.user.edge_followed_by.count
    });
    console.log('IG user ', igUsername, 'has ', followersCount, 'followers');
    await wait(1);
    return [igUsername,followersCount];
  }
  const followersList = [];
  const thunkList = list.map(user => () => run(user));
  thunkList.push(() => Promise.resolve(true));
  await thunkList.reduce((acc,next,i) => {
    return (typeof acc == 'function' ? acc():acc).catch(err => Promise.resolve([false])).then((userCount) => {
      followersList.push(userCount);
      return next();
    })
  });
  const sortedList = followersList.sort((a,b) => b[1] - a[1]);
  console.log('sorted list:');
  const csvList = sortedList.map(e => e[0]+','+e[1]+'\n');
  fs.writeFileSync('./followers.csv',csvList);
  browser.close();
}
init();