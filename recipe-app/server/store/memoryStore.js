// Temporary memory store untill we get a database

const store = {
  users: new Map(),            
  usersByUsername: new Map(),  
  publicRecipes: [],           
};

module.exports = { store };
