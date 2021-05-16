require('dotenv').config()
const puppeteer = require('puppeteer');
const CronJob = require('cron').CronJob
const venom = require('venom-bot');

async function initial ()  {
  let client = null;
  let date = new Date()

  console.log('Processo iniciado '+ 
   String(date.getHours()).padStart(2,'0')
   +':'+
   String(date.getMinutes()).padStart(2,'0')
   +' '+
   String(date.getDate()).padStart(2,'0')
   +'/'+
   String(date.getMonth()+1).padStart(2,'0')
  )

  const browser = await puppeteer.launch();
 
  const urlPrincipal = 'https://rmanguinho.github.io/';

  const page = await navigate(browser, urlPrincipal)

  const courses = await loadCourses(page);

  const coursesFormatted = await processCourses(courses)

  await browser.close();

  if(!client){
    client = await venom.create()
  }

  coursesFormatted.forEach(message => {
      let textMessage = '*'+message.title+'*' +'\n'+
      (message.old_price ? '_De:_ ' +'~'+message.old_price+'~' + "\n" : '')+
      (message.percent ? '_Com:_ '+ message.percent + "\n" : '')+
      '_Por:_ ' +message.price + "\n\n" +
      '_'+message.src+'_' + "\n\n"
      
      sendMessage(client,textMessage)   
    }
  )
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
async function processCourses(courses){

    const data = courses.map(async(course,index,array) => {
      console.log(`Processo ${index +1} executando`)

      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.goto(course.src);
     
      await page.waitForSelector('.price-text--price-part--Tu6MH',{timeout:5000});
      
      course['price'] = await page.evaluate(() => {
      
      const price = document.querySelector('.price-text--price-part--Tu6MH')
      .children[1]
      .children[0]
      .innerText.split("R$")[1]      
      
        return price
      });

      if((array.length - 1) !== index) {
        await page.waitForSelector('.price-text--original-price--2e-F5',{timeout:5000});
        await page.waitForSelector('.udlite-clp-percent-discount',{timeout:5000});

        course['old_price'] = await page.evaluate(() => {
      
        const old_price = document.querySelector('.price-text--original-price--2e-F5')
          .children[0]
          .children[1]
          .children[0]
          .children[0]
          .innerText.split("R$")[1]    
        
          return old_price
        });

        course['percent'] = await page.evaluate(() => {
        
        const percent = document.querySelector('.udlite-clp-percent-discount')
          .children[1]
          .innerText.split(" ")[0]
          
          return percent
        })
      };

      await browser.close();

      return course;
    })
    return await Promise.all(data)
}
function sendMessage(client, text) {
  client
    .sendText(`${process.env.USER_PHONE}@c.us`, text)
    .then(() => {})
    .catch((erro) => {
      console.error('Erro ao enviar mensagem: ', erro);
    });
}

let job = new CronJob(`${process.env.MINUTE1} ${process.env.HOUR1} 1-31 0-11 0-6`, initial, null 
,true, `${process.env.LOCALE}`);

let job2 = new CronJob(`${process.env.MINUTE2} ${process.env.HOUR2} 1-31 0-11 0-6`, initial, null 
,true, `${process.env.LOCALE}`);

job.start();
job2.start();