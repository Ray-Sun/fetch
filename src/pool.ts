'use strict';
import * as Parser from "rss-parser";
import { IFeed } from "bargain-dao/dist/items/feed";
import { Source } from "./shared/source";
import { addDays } from 'tools-util';
import { SALEFINDERRETAILERS } from "./sources";
import * as cheerio from "cheerio";


const nodeFetch = require('node-fetch');


export class Pool {

    private parser: Parser;

    constructor() {
        this.parser = new Parser();
    }
    public getRSSData: any = async (source: Source) => {
        let bargains: IFeed[] = [];
        let feeds = await this.parser.parseURL(source.url);
        feeds.items.map((item: any) => {
            let pubDate = new Date(item.pubDate);
            let $ = cheerio.load(item.content);
            bargains.push({
                name: item.title,
                source: source.name,
                url: item.link,
                coverPicture:$('img').attr('src'),
                description: $('p').first().text().trim(),
                pubDate: pubDate,
                expiredDate: addDays(source.expiredDays, pubDate),
            });
        });
        return bargains;
    }

    public getCatalogueData: any = () => {
        const URL = 'https://salefinder.com.au';
        const SUFFIX = '-catalogue';
        const TIMEZONE = ' GMT+1100 (CST)';
        let bargains: IFeed[] = [];

        let catalogueBooks: { source: string, url: string, pubDate: Date, expiredDate: Date }[] = [];

        //step 1 get catalogue url of every retailer 
        let caUrlsPromises = [];
        for (let retailer of SALEFINDERRETAILERS) {
            let crp = nodeFetch(`${URL}/${retailer}${SUFFIX}`)
                .then((res: any) => res.text())
                .then((result: any) => {
                    let $ = cheerio.load(result);
                    let catalogueDates = $('.retailer-catalogue');
                    for (let index = 0; index < catalogueDates.length; index++) {
                        let catalogue = $(catalogueDates[index]);
                        let dates = catalogue.find('.catalogue-date').text().split('valid')[1].split('-');
                        let catalogueItem = {
                            source: retailer,
                            url: URL + catalogue.find('a').attr('href').replace('catalogue2', 'list'),
                            pubDate: new Date(dates[0] + TIMEZONE),
                            expiredDate: addDays(1,new Date(dates[1] + TIMEZONE))
                        }
                        catalogueBooks.push(catalogueItem);
                    }
                });
            caUrlsPromises.push(crp);
        };

        let cataloguePages: { source: string, url: string, pubDate: Date, expiredDate: Date }[] = [];
        return Promise.all(caUrlsPromises)
            .then(info => {
                //step 2 get all catalogue pages
                let caPageUrlsPromises = [];
                for (let catalogeBook of catalogueBooks) {
                    let crp = nodeFetch(catalogeBook.url)
                        .then((res: any) => res.text())
                        .then((html: any) => {
                            let $ = cheerio.load(html);
                            let latsPageText = $('.pagenumbers a').last().text();
                            if (latsPageText.includes(']')) {
                                latsPageText = latsPageText.split('-')[1].split(']')[0];
                            }
                            let lastPage = parseInt(latsPageText);
                            for (let index = 1; index <= lastPage; index++) {
                                let cataloguePageItem = Object.assign({}, catalogeBook);
                                cataloguePageItem.url = cataloguePageItem.url + '?qs=' + index;
                                cataloguePages.push(cataloguePageItem);
                            }
                        });
                    caPageUrlsPromises.push(crp);
                }
                return Promise.all(caPageUrlsPromises);
            })
            .then(info=>{
                //step 3 get the product info on every page
                let itemsPromises = [];
                for (let item of cataloguePages){
                    let crp = nodeFetch(item.url)
                    .then((res:any)=>res.text())
                    .then((html:any)=>{
                        let $ = cheerio.load(html);
                        let bargainList = $('.item-landscape');
                        for(let index=0;index<bargainList.length;index++){
                            let barginHtml = $(bargainList[index]);
                            let feed: IFeed = {
                                source: item.source,
                                name: barginHtml.find('a.item-name').text().trim(),
                                url: URL + barginHtml.find('a.item-name').attr('href'),
                                coverPicture:barginHtml.find('a img').attr('src'),
                                description: barginHtml.find('.price-options').text().trim().replace(/\t/g,'').replace(/\n/g,' ').replace(/\s+/g,' '),
                                pubDate: item.pubDate,
                                expiredDate: item.expiredDate
                            }
                            bargains.push(feed);
                        }
                    }); 
                    itemsPromises.push(crp);
                }
                return Promise.all(itemsPromises);
            })
            .then((info)=>{
                return bargains;
            })
            .catch(error => console.error(error));
    }
}