const puppeteer = require('puppeteer');
const CronJob = require('cron').CronJob
const fs = require('fs');


let courses = [];

async function initial ()  {
  const date = new Date()

  console.log('Processo iniciado '+ 
   date.getDate()+'/'+ date.getMonth() +' '+
   date.getHours()+':'+ date.getMinutes())

  const browser = await puppeteer.launch();
 
  const urlPrincipal = 'https://rmanguinho.github.io/';

  const page = await navigate(browser, urlPrincipal)

  const courses = await loadCourses(page);

  await processCourses(courses)

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
async function processCourses(courses){

    const data = courses.map(async(course,index) => {
      console.log(`Processo ${index +1} executando`)

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
         console.log('Processos finalizados')
    })  
}


let job = new CronJob('0 0 9 1-31 0-11 0-6', initial(), null 
,true, 'America/Campo_Grande');

let job2 = new CronJob('0 15 1-31 0-11 0-6', initial(), null 
,true, 'America/Campo_Grande');

job.start();
job2.start();