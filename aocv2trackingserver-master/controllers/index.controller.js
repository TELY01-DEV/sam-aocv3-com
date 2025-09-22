exports.index = (req, res) => {
    res.render('index', { title: 'AOC-V.2 Tracking Server On' });
};

exports.error_codes = (req, res) => {
    var error_codes = {
        500: 'Error on server.',
    }
    res.json(error_codes);
};