import Papa from 'papaparse';

/**
 * Load PUWER questions from CSV file
 * @returns {Promise} - Promise resolving to array of question objects
 */
export const loadQuestions = async () => {
  try {
    // Use the full path to the CSV file in the public folder
    const response = await fetch(`${process.env.PUBLIC_URL}/PUWER_Questions_new.csv`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV file: ${response.status} ${response.statusText}`);
    }
    
    const csvText = await response.text();
    
    return new Promise((resolve) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          // Process the CSV data and structure it with section groupings
          const questions = results.data
            .filter(row => row['Regulation Number'] && row['PUWER Question'])
            .map(row => ({
              id: row['Regulation Number'],
              section: row['Regulation Number'].split('.')[0],
              regulationNumber: row['Regulation Number'],
              text: row['PUWER Question']
            }));
          
          resolve(questions);
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
          resolve([]);
        }
      });
    });
  } catch (error) {
    console.error('Error loading questions from CSV:', error);
    return [];
  }
};