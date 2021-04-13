const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

let courses = [];

async function initial ()  {
  const browser = await puppeteer.launch();
 
  const urlPrincipal = 'https://rmanguinho.github.io/';

  const page = await navigate(browser, urlPrincipal)

  const courses = await loadCourses(page);

  await processCourses(browser, courses)

  await browser.close();

}
async function navigate(browser , url){
  const page = await browser.newPage();
 
  await page.goto(url);

  return page
}
async function loadCourses(page){
  courses = [];

  const hrefs = await page.$$eval('a', links => links.map(element => {
    return({ 
      "src": element['href'],
      "title": element.innerText
    })  
  }));

   let data =  await Promise.all(hrefs)
   courses = [...courses,...data]

   return courses

}
async function saveCourses(courses){
  fs.writeFileSync('discountCourses.json', JSON.stringify(courses, null, 2) , 
      err => {
      if (err) 
        throw new Error('something went wrong');
      console.log('Well Done');
      }
  )
}
async function readCourses(url){
  const data = fs.readFileSync(url);
  const courses = await JSON.parse(data);

  return courses;
}
async function processCourses(browser, courses){

    const data = courses.map(async(course) => {

      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.goto(course.src);
     
       await page.waitForSelector('.price-text--price-part--Tu6MH',{timeout:5000});
    
       course['price'] = await page.evaluate(() => {
        
       const price = document.querySelector('.price-text--price-part--Tu6MH').children[1].children[0].innerText.split("R$")[1]      
        
         return price
       });
       course['date'] = new Date;
  
       await browser.close();
      return course;
    })
    
    Promise.all(data)
      .then(async valores => {  
         saveCourses(valores)
    })  
}

initial()
