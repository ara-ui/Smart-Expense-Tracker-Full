const User = require('../model/User');
const Expense = require("../model/Expense");
const Order = require("../model/Order");
const S3Service = require("../services/S3Service");
const bcrypt = require("bcrypt");
const { generateAccessToken } = require("../utils/jwt");


//createuser


const createUser = async (req, res) => {
    const { name, email, password } = req.body;

    try {

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "All fields are required",
            });
        }

        const existingUser = await User.findOne({
            email
        });

        if (existingUser) {

            return res.status(409).json({
                success: false,
                message: "User already exists"
            });

        }

        // HASH PASSWORD to store while creating a user
        const hash = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hash
        });

        return res.status(201).json({
            success: true,
            message: "User created successfully",
            user
        });

    }
    catch (err) {

        console.log(err);

        res.status(500).json({
            success: false,
            message: "Something went wrong",

        });
    }
}


const loginUser = async (req, res) => {

    try {
       
       
        const { email, password } = req.body;
         if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }
        const user = await User.findOne({
            email
        });

        if (!user) {

            return res.status(404).json({
                success: false,
                message: "User not found"
            });

        }

            const result = await bcrypt.compare(password, user.password);

            if (!result) {

                return res.status(401).json({
                    success: false,
                    message: "User not authorized"
                });

            }

            // Password matched
            return res.status(200).json({

                success: true,

                message: "Login Successful",

                token: generateAccessToken(

                    user._id,

                    user.name,

                    user.email,

                    user.isPremiumUser

                )

            });

    }

    catch (err) {

        console.log(err);

        return res.status(500).json({

            success: false,

            message: "Something went wrong"

        });

    }

};

//income part starts here

const updatedincome=async(req,res)=>{
    try{
        const{monthlyIncome}=req.body;

        req.user.monthlyIncome=monthlyIncome;
        await req.user.save();

        res.status(200).json({
            success:true,
            monthlyIncome:req.user.monthlyIncome
        });
    }
    catch(err){
        console.log(err);
        res.status(500).json({
            success:false,
            message:"Something went wrong"
        });
    }
}


//get income

const getincome=async (req,res)=>{
    try{
        res.status(200).json({
            success:true,
            monthlyIncome:req.user.monthlyIncome
        });
    }
    catch(err){
        console.log(err);
        res.status(500).json({
            success:false,
            message:"Something went wrong"
        });
    }
}

//budget

const getExpenseTotalBetweenDates = async (userId, startDate, endDate) => {
    const result = await Expense.aggregate([
        {
            $match: {
                userId: userId,
                createdAt: {
                    $gte: startDate,
                    $lt: endDate
                }
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: "$amount" }
            }
        }
    ]);

    return result.length > 0 ? result[0].total : 0;
};

const getBudget = async (req, res) => {
    try {

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        const monthlyBudget = Number(req.user.monthlyBudget) || 0;
        const currentMonthExpenses = await getExpenseTotalBetweenDates(
            req.user._id,
            startOfMonth,
            startOfNextMonth
        );

        res.status(200).json({
            success: true,
            monthlyBudget,
            currentMonthExpenses,
            remainingBudget: monthlyBudget - currentMonthExpenses
        });

    }
    catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: "Something went wrong"
        });
    }
};

const updateBudget = async (req, res) => {
    try {

        const { monthlyBudget } = req.body;

        const isValid =
            monthlyBudget !== undefined &&
            monthlyBudget !== null &&
            !isNaN(monthlyBudget) &&
            Number(monthlyBudget) > 0;

        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: "Monthly budget must be a positive number"
            });
        }

        req.user.monthlyBudget = Number(monthlyBudget);
        await req.user.save();

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        const currentMonthExpenses = await getExpenseTotalBetweenDates(
            req.user._id,
            startOfMonth,
            startOfNextMonth
        );

        res.status(200).json({
            success: true,
            monthlyBudget: req.user.monthlyBudget,
            currentMonthExpenses,
            remainingBudget: req.user.monthlyBudget - currentMonthExpenses
        });

    }
    catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: "Something went wrong"
        });
    }
};

//quick statistics

const getQuickStats = async (req, res) => {
    try {

        const now = new Date();

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

        const totalExpenses = Number(req.user.totalExpense) || 0;

        const thisMonthExpenses = await getExpenseTotalBetweenDates(
            req.user._id,
            startOfMonth,
            startOfNextMonth
        );

        const todayExpenses = await getExpenseTotalBetweenDates(
            req.user._id,
            startOfToday,
            startOfTomorrow
        );

       const topCategoryRow = await Expense.aggregate([
            {
                $match: {
                    userId: req.user._id
                }
            },
            {
                $group: {
                    _id: "$category",
                    categoryTotal: {
                        $sum: "$amount"
                    }
                }
            },
            {
                $sort: {
                    categoryTotal: -1
                }
            },
            {
                $limit: 1
            }
        ]);

        const highestCategory = topCategoryRow.length > 0
            ? topCategoryRow[0]._id
            : null;

        res.status(200).json({
            success: true,
            totalExpenses,
            thisMonthExpenses,
            todayExpenses,
            highestCategory
        });

    }
    catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: "Something went wrong"
        });
    }
};


//membership 
const getMembership = async (req, res) => {
    try {

        const lastOrder = await Order.findOne({
            userId: req.user._id,
            status: "SUCCESSFUL"
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            currentPlan: req.user.isPremiumUser ? "Premium" : "Free",
            membershipStatus: req.user.isPremiumUser ? "Active" : "Free",
            purchaseDate: lastOrder ? lastOrder.createdAt : null,
            lastPaymentDate: lastOrder ? lastOrder.updatedAt : null,
            expiryDate: null,
            remainingDays: null,
            paymentMethod: null
        });

    }
    catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: "Something went wrong"
        });
    }
};


const downloadExpenses = async (req, res) => {

    try {


        const expenses = await Expense.find({
            userId: req.user._id
        });

        const data = JSON.stringify(expenses);

        const filename = `Expenses/User-${req.user._id}/${Date.now()}.txt`;

        const fileURL = await S3Service.uploadToS3(data, filename);

        return res.status(200).json({
            success: true,
            fileURL
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            success: false,
            message: "Something went wrong"
        });

    }

};
module.exports = { createUser, loginUser,updatedincome ,getincome,downloadExpenses,getBudget,updateBudget,getQuickStats,getMembership};