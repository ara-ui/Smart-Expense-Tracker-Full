const mongoose = require('mongoose');
const Expense=require('../model/Expense');
const aiService = require("../services/aiService");


const addExpense = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        const { amount, description } = req.body;

        if (!amount || !description) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        // Get category from AI
        let category = "Other";

        try {
            category = await aiService.getCategory(description);
        } catch (err) {
            console.log("AI Error:", err.message);
        }

        let expense;
        await session.withTransaction(async () => {
            const created = await Expense.create(
                [{
                    amount,
                    description,
                    category,
                    userId: req.user._id
                }],
                { session }
            );

            expense = created[0];

            // Add expense amount to user's total expense
            req.user.totalExpense =
                Number(req.user.totalExpense) + Number(amount);

            await req.user.save({ session });
        });

        res.status(201).json({
            success: true,
            message: "Expense Added",
            expense
        });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: "Something went wrong"
        });
    }
    finally {
        session.endSession();
    }
};

//get expenses

const getExpenses=async(req,res)=>{
    try{
        //pagination

        const page=Number(req.query.page)|| 1;
        const ITEMS_PER_PAGE = Number(req.query.limit) || 10;
        const offset=(page -1) *ITEMS_PER_PAGE;

        const totalExpenses=await Expense.countDocuments({
            userId: req.user._id
        });


        const expenses = await Expense.find({
            userId: req.user._id
        })
        .skip(offset)
        .limit(ITEMS_PER_PAGE);


        res.status(200).json({
            success:true,
            expenses,
            totalExpenses,
            currentPage:page,
            hasNextPage:ITEMS_PER_PAGE*page < totalExpenses,
            nextPage:page+1,
            hasPreviousPage:page >1,
            previousPage:page-1,
            lastPage:Math.ceil(totalExpenses/ITEMS_PER_PAGE)
        });
        
    }
    catch(err){
        console.log(err);
        res.status(500).json({
            success:false,
            message:"Something went wrong"
        });
    }
};

//delete expenses
const deleteExpense = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        let expense;
           await session.withTransaction(async () => {
            expense = await Expense.findOne({
                _id: req.params.id,
                userId: req.user._id
            }).session(session);

            if (!expense) {
                return;
            }

            await Expense.deleteOne({
                _id: expense._id,
                userId: req.user._id
            }).session(session);

            req.user.totalExpense =
                Number(req.user.totalExpense) - Number(expense.amount);

            await req.user.save({ session });
        });

        if (!expense) {
            return res.status(404).json({
                success: false,
                message: "Expense not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Expense deleted"
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: "Something went wrong"
        });
    }
    finally {
        session.endSession();
    }
};

module.exports={
    addExpense,
    getExpenses,
    deleteExpense
}