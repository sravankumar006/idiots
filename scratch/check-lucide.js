const lucide = require('lucide-react');
const keys = Object.keys(lucide);
console.log("Total icons:", keys.length);
console.log("Github matching:", keys.filter(k => k.toLowerCase().includes('git')));
