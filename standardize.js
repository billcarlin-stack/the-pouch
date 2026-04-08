const fs = require('fs');
const path = require('path');

const walk = (dir, callback) => {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(dirPath);
    });
};

const standardizeTitles = (content) => {
    // Standardize all h1 classNames
    return content.replace(/<h1 className=\"([^\"]*)\"/g, (match, classes) => {
        const extraClasses = classes.includes('flex') ? ' flex items-center gap-4' : '';
        return '<h1 className=\"text-5xl font-black text-white uppercase tracking-tight font-space' + extraClasses + '\"';
    });
};

const standardizeColors = (content) => {
    let newContent = content;
    // Light mode text replacements
    newContent = newContent.replace(/text-gray-[56789]00/g, 'text-white/80');
    newContent = newContent.replace(/text-gray-[34]00/g, 'text-white/40');
    
    // Light mode background replacements
    newContent = newContent.replace(/bg-gray-50/g, 'bg-[#1A1411]');
    newContent = newContent.replace(/bg-gray-100/g, 'bg-white/5');
    newContent = newContent.replace(/bg-gray-200/g, 'bg-white/10');
    newContent = newContent.replace(/bg-gray-300/g, 'bg-white/20');
    newContent = newContent.replace(/bg-gray-400/g, 'bg-white/30');
    newContent = newContent.replace(/bg-gray-500/g, 'bg-white/40');
    
    // Light mode border replacements
    newContent = newContent.replace(/border-gray-[12]00/g, 'border-white/10');
    
    // Specific elements like emerald titles, etc.
    newContent = newContent.replace(/text-emerald-600/g, 'text-white');
    newContent = newContent.replace(/text-hfc-brown\b/g, 'text-white');
    
    // Replace light mode specific combinations
    newContent = newContent.replace(/bg-white border-gray-200/g, 'bg-[#1A1411] border-white/10');
    newContent = newContent.replace(/bg-white border border-gray-100/g, 'bg-[#1A1411] border border-white/10');
    
    // Remove specific string requested
    newContent = newContent.replace(/<p[^>]*>\"Elite fitness through real-time physiological monitoring\.\"<\/p>/g, '');
    
    return newContent;
};

const processFile = (filePath) => {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        let originalContent = fs.readFileSync(filePath, 'utf8');
        let newContent = standardizeTitles(originalContent);
        newContent = standardizeColors(newContent);
        
        if (originalContent !== newContent) {
            fs.writeFileSync(filePath, newContent);
            console.log('Updated:', filePath);
        }
    }
};

walk('frontend/src/pages', processFile);
walk('frontend/src/components', processFile);
