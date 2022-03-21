import * as cheerio from 'cheerio'
import fs from 'fs'
import async from 'async'

export default {
  url: 'https://www.nomor.net/_kodepos.php?_i=provinsi-kodepos&daerah=&jobs=&perhal=1000&urut=&asc=000011111&sby=000000&no1=2',
  async scraper(browser) {
    let page = await browser.newPage()
    console.log(`Navigating to ${this.url}`)

    await page.setExtraHTTPHeaders({
      "Accept-Language": "en,en-US;q=0,5",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,/;q=0.8",
    })

    await page.goto(this.url, { waitUntil: 'load', timeout: 0 })

    const provinceHTML = await page.evaluate(() => document.body.innerHTML)
    const p = cheerio.load(provinceHTML, null, false)

    const provinces = [],
      regencies = [],
      districts = [],
      villages = []
    p('table tr[bgcolor=#ccffff]').each((_, element) => {
      const area = p(element).find('td')

      provinces.push({
        no: p(area[0]).text(),
        link: p(area[1]).find('a').attr('href') + '&perhal=1000',
        name: p(area[1]).text(),
        code: p(area[11]).text()
      })
    })

    console.log('success provinces ' + this.url)

    for (const province of provinces) {
      await page.goto(province.link, { waitUntil: 'load', timeout: 0 })

      const regencyHTML = await page.evaluate(() => document.body.innerHTML)
      const r = cheerio.load(regencyHTML, null, false)

      r('table tr.cstr').each((_, element) => {
        const area = r(element).find('td')

        regencies.push({
          no: r(area[0]).text(),
          link: r(area[2]).find('a').attr('href') + '&perhal=1000',
          type: r(area[1]).text(),
          name: r(area[2]).text(),
          code: r(area[8]).text(),
          provinceCode: province.code
        })
      })

      console.log('success regencies ' + province.link)
    }

    for (const regency of regencies) {
      await page.goto(regency.link, { waitUntil: 'load', timeout: 0 })

      const districtHTML = await page.evaluate(() => document.body.innerHTML)
      const d = cheerio.load(districtHTML, null, false)

      d('table tr[bgcolor=#ccffff]').each((_, element) => {
        const area = d(element).find('td')

        districts.push({
          no: d(area[0]).text(),
          link: d(area[1]).find('a').attr('href') + '&perhal=1000',
          name: d(area[1]).text(),
          code: d(area[5]).text(),
          regencyCode: regency.code
        })
      })

      console.log('success districts ' + regency.link)
    }

    for (const district of districts) {
      await page.goto(district.link, { waitUntil: 'load', timeout: 0 })

      const villageHTML = await page.evaluate(() => document.body.innerHTML)
      const v = cheerio.load(villageHTML, null, false)

      v('table tr[bgcolor=#ccffff]').each((_, element) => {
        const area = v(element).find('td')

        villages.push({
          no: v(area[0]).text(),
          link: v(area[2]).find('a').attr('href') + '&perhal=1000',
          name: v(area[2]).text(),
          code: v(area[3]).text(),
          postalCode: v(area[1]).text(),
          districtCode: district.code
        })
      })

      console.log('success villages ' + district.link)
    }

    const areas = [
      { filename: 'provinces', file: provinces },
      { filename: 'regencies', file: regencies },
      { filename: 'districts', file: districts },
      { filename: 'villages', file: villages }
    ]

    async.each(areas, (item, callback) => {
      fs.writeFile(
        './output/' + item.filename + '.json',
        JSON.stringify(item.file, null, 2),
        'utf8',
        (err) => {
        if (err) {
          console.log(err)
        } else {
          console.log(item.filename + '.json was updated.')
        }

        callback()
      })

    }, (err) => {
      if (err) {
        console.log('A file failed to process')
      } else {
        console.log('All files have been processed successfully')
      }
    })
  }
}