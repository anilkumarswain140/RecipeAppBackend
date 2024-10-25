
const convertPreparationTime = (preparationTime) => {
    if (preparationTime < 10) {
      return preparationTime * 60;
    }
    return preparationTime;
  };
  
  module.exports = {
    convertPreparationTime,
  };