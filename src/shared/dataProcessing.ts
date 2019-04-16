import { Dao } from "bargain-dao";
import { DBtype } from "bargain-dao/dist/shared/dbList";
import { IFeed } from "bargain-dao/dist/items/feed";
import { ITip } from "bargain-dao/dist/items/tip";
import { sendEmail } from "tools-util";
import { IMailOptions } from 'tools-util/dist/interfaces';
let dao = new Dao(DBtype.MONGO);
let feed = dao.feed;
let tip = dao.tip;

export const barginInfo2Feed = async (feeds: IFeed[]) => {

    console.log('got data now');
    let newFeedsStartId: any;
    if (feeds.length > 0) {
        //add new data
        await feed.addItems(feeds).then((result: any) => {
            result.length == 0 || (newFeedsStartId = result[0]._id);
        });
        //new feed data come in
        let JOBS_COUNTS = 1;// for the jobs like "send email" run asnyc

        if (newFeedsStartId) {
            //check keywords 
            //group by email
            let tips: ITip[];
            await tip.getItemsGroupByEmail().then((result: ITip[]) => {
                tips = result;
            });
            await feed.getMatchedFeeds(newFeedsStartId, tips).then(async (result: any) => {
                // console.log('end ..', result);
                let emailList = Object.keys(result);
                for (const email of emailList) {

                    let html = '';
                    result[email].forEach((feed: IFeed) => {
                        html += `<p><h3>${feed.name}</h3>`;
                        html += '<ul>'
                        html += `<li><a href='${feed.url}'>Go To The Page</a></li>`;
                        html += `<li>Publish Time: ${feed.pubDate.toLocaleString()}</li>`
                        html += `<div>${feed.description ? feed.description : "No More Detail"}</div>`;
                        html += '</ul></p>';
                    });

                    if (html) {
                        let mailOptions: IMailOptions = {
                            to: email,
                            subject: 'The New Feeds For You',
                            html: html
                        }
                        console.log('sending email to ', email);
                        await sendEmail(mailOptions).then(sendInfo => {
                            // console.log('email info:', sendInfo);
                        });
                    }
                }
                JOBS_COUNTS--;
                if (JOBS_COUNTS == 0) process.exit();

            });

            //TODO: 
            //group by telegram
        }

        process.exit();
    } else {
        process.exit();
    }
}