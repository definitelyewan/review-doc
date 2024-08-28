import db from '$lib/server/db.js';

export const load = async(loadEvent) => {

    const media = await db.query('SELECT * FROM media ORDER BY media_name ASC');
    
    let media_data = new Object({media: []});
    let media_options = [];

    media.forEach(info => {
        let start = info.media_release_date_range_start.toISOString().split('T')[0];
        let end = null;

        if (info.media_release_date_range_end != null) {
            end = info.media_release_date_range_end.toISOString().split('T')[0];
        }

        media_options.push({
            label: info.media_name,
            value: {
                id: info.media_id,
                release_start: start,
                release_end: end,
                sub_name: info.media_sub_name,
                type : info.media_type
            }
        });
    });


    media_data.media = media_options;
    return {media_data};

}