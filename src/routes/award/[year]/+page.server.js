
import db  from '$lib/server/db.js';


export const load = async(loadEvent) => {

    const { fetch, params } = loadEvent;
    

    let media_data = new Object({user: []});
    let unique_awards = new Object([]);
    const year = params.year;


    let users = await db.query(`SELECT user_name, user_id FROM user`);

    for (const user of users) {
        let block = new Object(
        {
            user_id: user.user_id, 
            user_name: user.user_name, 
            media_award_info: []
        });

        let awards = await db.query(`SELECT * FROM award WHERE user_id = ${user.user_id} AND award_issue_year = ${year}`);

        for (const award of awards) {
            let medias = await db.query(`SELECT * FROM media WHERE media_id = ${award.media_id}`);
            block.media_award_info.push({award: award, media: medias[0]});
        }


        block.media_award_info.sort((a, b) => {
            if (a.award_name === "best of the year") {
              return -1;
            } else if (b.award_name === "best of the year") {
              return 1;
            } else {
              return 0; 
            }
          });

        if (block.media_award_info.length > 0) {
            media_data.user.push(block);
        }

    }

    users = await db.query(`SELECT DISTINCT award_name from award WHERE award_issue_year = ${year}`);
    
    users.forEach(name => {
        unique_awards.push(name["award_name"]);
        
    });
    return {media_data, unique_awards};

}