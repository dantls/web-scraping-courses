const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');



(async function start(){
  await getDiscountData()
  get()

})()

async function getDiscountData(){
 
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
 
    await page.goto('https://rmanguinho.github.io/');

    const list = await page.evaluate(() => {
      const listCourses = [...document.getElementsByTagName('a')];

      const list = listCourses.map(element => {
        return({ 
          "src": element['href'],
          "title": element.innerText
        })
      })
      
      return list
    });

    fs.writeFileSync('discountCourses.json', JSON.stringify(list, null, 2) , 
      err => {
      if (err) 
        throw new Error('something went wrong');
      console.log('Well Done');
      }
    )

    await browser.close();
}

async function get(){
  const data = fs.readFileSync(path.join(__dirname,'discountCourses.json'));
  const courses = await JSON.parse(data);

  const retorno = courses.map(async(course) => {
 
    
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(course.src);

    await page.waitForSelector('.price-text--price-part--Tu6MH',{timeout:5000});

    course['price'] = await page.evaluate(() => {
      
      const price = document.querySelector('.price-text--price-part--Tu6MH').children[1].children[0].innerText.split("R$")[1]      
      
      return price
    });
    course['dia'] = new Date;

    await browser.close();

    return course;
  })

  Promise.all(retorno)
    .then(async valores => {
      fs.writeFileSync('discountCourses.json', JSON.stringify(valores, null, 2) , 
      err => {
      if (err) 
        throw new Error('something went wrong');
      console.log('Well Done');
      }
    )
  })
  
  

}

