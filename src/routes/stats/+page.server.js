import db from "$lib/server/db.js";
import stats from "$lib/server/stats.js";

export const load = async ({ fetch, params, url }) => {
  // Get query parameters for filtering
  const reviewYear = url.searchParams.get('reviewYear');
  const releaseYear = url.searchParams.get('releaseYear');
  const mediaType = url.searchParams.get('mediaType');
  const reviewer = url.searchParams.get('reviewer');
  
  // Get media type statistics with filters
  const mediaTypeStats = await stats.get_filtered_media_type_stats({
    reviewYear,
    releaseYear,
    reviewer
  });

  // Get all available filter options for the dropdown selectors
  const reviewYears = await db.query(
    `SELECT DISTINCT YEAR(review_date) as year FROM review ORDER BY year DESC`
  );
  
  const releaseYears = await db.query(
    `SELECT DISTINCT YEAR(media_release_date_range_start) as year FROM media ORDER BY year DESC`
  );
  
  const mediaTypes = await db.query(
    `SELECT DISTINCT media_type FROM media ORDER BY media_type ASC`
  );
  
  const reviewers = await db.query(
    `SELECT DISTINCT user.user_name FROM user 
     INNER JOIN review ON user.user_id = review.user_id 
     ORDER BY user.user_name ASC`
  );

  // Get media list with ratings for detailed table view
  let mediaList = await db.query(`
    SELECT 
      media.media_id,
      media.media_name as title,
      YEAR(media.media_release_date_range_start) as releaseYear,
      YEAR(review.review_date) as reviewYear,
      media.media_type as mediaType,
      user.user_name as reviewer,
      CAST(review.review_score AS DECIMAL) / CAST(review.review_limit AS DECIMAL) * 10 as rating
    FROM 
      media
    INNER JOIN 
      review ON media.media_id = review.media_id
    INNER JOIN 
      user ON review.user_id = user.user_id
  `);

  // Format the results and ensure values are numbers
  mediaList = mediaList.map(item => ({
    ...item,
    rating: typeof item.rating === 'number' 
      ? parseFloat(item.rating.toFixed(1)) 
      : parseFloat(parseFloat(item.rating).toFixed(1)) || 0
  }));

  return { 
    mediaTypeStats,
    mediaList,
    filterOptions: {
      reviewYears: reviewYears.map(item => item.year),
      releaseYears: releaseYears.map(item => item.year),
      mediaTypes: mediaTypes.map(item => item.media_type),
      reviewers: reviewers.map(item => item.user_name)
    }
  };
};
