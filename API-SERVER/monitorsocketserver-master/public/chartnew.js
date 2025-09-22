function extObjectValues(obj) {
    if (typeof obj.values === 'undefined') {
        return Object.keys(obj).map(key => obj[key])
    }
    
    return obj.values();
}