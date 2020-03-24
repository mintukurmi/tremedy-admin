

const checkRole = function (allowedRoles){

    return (req, res, next) => {

        const result = allowedRoles.includes(req.role);

        if(!result){
            return res.render('./errors/error403');
        } else {
            next()
        }
    }
}

module.exports = checkRole