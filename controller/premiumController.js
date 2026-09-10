const User = require("../model/User");


const getLeaderBoard = async (req, res) => {

    try {

        const leaderboard = await User.find(
            {},
            {
                name: 1,
                totalExpense: 1,
                _id: 0
            }
        ).sort({
            totalExpense: -1
        });

        res.status(200).json(leaderboard);

    }

    catch (err) {

        console.log(err);

        res.status(500).json({

            success: false,

            message: "Something went wrong"

        });

    }

};

module.exports = {
    getLeaderBoard
};