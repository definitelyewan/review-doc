/**
 * Backend server code for the award page
 */

import db  from '$lib/server/db.js';

/**
 * On page load supply the frontend with unique cumulative awards and years
 * @param {*} loadEvent 
 * @returns 
 */
export const load = async(loadEvent) => {

    const { fetch, params } = loadEvent;

    let awards_by_name = [];
    let unique_years = [];
    let unique_awards = [];
    let best_of = [];
    const unique_awards_query = await db.query(`SELECT DISTINCT award_name from award ORDER BY award_name ASC`);
    const unique_years_query = await db.query(`SELECT DISTINCT award_issue_year from award ORDER BY award_issue_year DESC`);

    unique_awards_query.forEach(award => {
        unique_awards.push(award["award_name"]);
    });

    unique_years_query.forEach(year => {
        unique_years.push(year["award_issue_year"]);
    });

    // get information for each unique award type i.e best story
    for (const award of unique_awards) {

        const award_issue_years_query = await db.query(`SELECT DISTINCT award_issue_year from award WHERE award_name = '${award}' 
                                                        ORDER BY award_issue_year DESC`);

        let block = new Object({award_name: award, years: []});

        for (const year of award_issue_years_query) {
            const common_award = await db.query(`SELECT media.* FROM award INNER JOIN media 
                                                WHERE award.media_id = media.media_id AND award.award_issue_year = '${year.award_issue_year}' AND award.award_status = 'winner' AND award.award_name = '${award}' 
                                                GROUP BY award.media_id 
                                                ORDER BY COUNT(*) DESC LIMIT 1`);

            let year_block = new Object({year: year.award_issue_year, media: common_award});
            block.years.push(year_block);

        }

        block.years = block.years.filter(year => year.media.length > 0);

        if (block.award_name == "Best of the Year") {
            best_of.push(block.years);
        } else {
            awards_by_name.push(block);
        }

    }

    return {best_of,awards_by_name, unique_years};
}