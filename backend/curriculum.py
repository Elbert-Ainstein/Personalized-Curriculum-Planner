COURSE_CONTENT = {
    "title": "Python Programming: From Basics to OOP",
    "modules": [
        {"id": 1, 
         "title": "Introduction to Python", 
         "explanation": "Python is a popular, easy-to-learn programming language. Let's start by writing your first line of Python!", 
         "question": "Print 'Hello, World!' to the console.", 
         "answer_keywords": ["print", "Hello, World!"]},
        {"id": 2, 
         "title": "Variables and Data Types", 
         "explanation": "Variables store data. Python has several data types: integers, floats, strings, and booleans.", 
         "question": "Create a variable named 'age' and assign it the integer value 25.", 
         "answer_keywords": ["age", "=", "25"]},
        {"id": 3, "title": "Working with Strings", "explanation": "Strings are text. You can use single or double quotes.", "question": "Create a variable called 'greeting' and assign it the string 'Hello!'.", "answer_keywords": ["greeting", "=", "'Hello!'", '"Hello!"']},
        {"id": 4, "title": "Numbers and Arithmetic", "explanation": "Python can do math with integers and floats.", "question": "Calculate 7 + 3 and assign the result to a variable called 'result'.", "answer_keywords": ["result", "=", "10"]},
        {"id": 5, "title": "Booleans and Comparisons", "explanation": "Booleans are True or False. You can compare values using ==, !=, >, <, etc.", "question": "Is 10 greater than 5? Assign the result to 'is_greater'.", "answer_keywords": ["is_greater", "=", "True"]},
        {"id": 6, "title": "Lists", "explanation": "Lists store multiple values. Use square brackets [].", "question": "Create a list called 'fruits' with 'apple', 'banana', and 'cherry'.", "answer_keywords": ["fruits", "=", "[", "apple", "banana", "cherry", "]"]},
        {"id": 7, "title": "Accessing List Elements", "explanation": "You can access list items by index, starting at 0.", "question": "Get the first item from the 'fruits' list and assign it to 'first_fruit'.", "answer_keywords": ["first_fruit", "=", "fruits", "[", "0", "]"]},
        {"id": 8, "title": "Dictionaries", "explanation": "Dictionaries store key-value pairs. Use curly braces {}.", "question": "Create a dictionary called 'person' with keys 'name' (value 'Alice') and 'age' (value 30).", "answer_keywords": ["person", "=", "{" , "'name'", "'Alice'", "'age'", "30", "}"]},
        {"id": 9, "title": "If Statements", "explanation": "Use if, elif, and else to control flow.", "question": "Write an if statement that prints 'Adult' if age is 18 or older.", "answer_keywords": ["if", "age", ">=", "18", "print", "Adult"]},
        {"id": 10, "title": "For Loops", "explanation": "For loops let you repeat actions. Use 'for item in list'.", "question": "Write a for loop that prints each fruit in the 'fruits' list.", "answer_keywords": ["for", "in", "fruits", "print"]},
        {"id": 11, "title": "While Loops", "explanation": "While loops repeat as long as a condition is True.", "question": "Write a while loop that counts from 1 to 5 and prints each number.", "answer_keywords": ["while", "<=", "print"]},
        {"id": 12, "title": "Functions", "explanation": "Functions let you reuse code. Define with 'def'.", "question": "Write a function called 'greet' that takes a name and prints 'Hello, name!'.", "answer_keywords": ["def", "greet", "print"]},
        {"id": 13, "title": "Function Return Values", "explanation": "Functions can return values using 'return'.", "question": "Write a function 'add' that returns the sum of two numbers.", "answer_keywords": ["def", "add", "return", "+"]},
        {"id": 14, "title": "File I/O", "explanation": "You can read and write files using open().", "question": "Write code to open a file called 'data.txt' for writing.", "answer_keywords": ["open", "'data.txt'", "'w'"]},
        {"id": 15, "title": "Error Handling", "explanation": "Use try and except to handle errors.", "question": "Write a try-except block that catches any exception and prints 'Error!'.", "answer_keywords": ["try", "except", "print", "Error"]},
        {"id": 16, "title": "Basic OOP: Classes", "explanation": "Classes let you create your own types. Use 'class'.", "question": "Define a class called 'Dog' with an __init__ method that sets a 'name' attribute.", "answer_keywords": ["class", "Dog", "def", "__init__", "self", "name"]},
        {"id": 17, "title": "Basic OOP: Objects", "explanation": "You can create objects from classes.", "question": "Create a Dog object named 'my_dog' with the name 'Buddy'.", "answer_keywords": ["my_dog", "=", "Dog", "'Buddy'"]},
        {"id": 18, "title": "Course Complete!", "explanation": "Congratulations! You've completed the Python Programming course. You now know the basics of Python, including variables, data types, control flow, functions, lists, dictionaries, file I/O, error handling, and OOP.", "question": None, "answer_keywords": []}
    ]
}

ALGEBRA1_COURSE_CONTENT = {
    "title": "Algebra 1: Foundations",
    "modules": [
        {
            "id": 1,
            "title": "What is a Variable?",
            "explanation": "In Algebra, a variable is a symbol (like x or y) that stands for a number we don't know yet. Variables let us write equations and solve problems.",
            "question": "What is the variable in the equation `x + 3 = 7`?",
            "answer_keywords": ["x"]
        },
        {
            "id": 2,
            "title": "Solving Linear Equations",
            "explanation": "A linear equation is an equation where the variable is only to the first power (no exponents). To solve `x + 3 = 7`, subtract 3 from both sides to get `x = 4`.",
            "question": "Solve for x: `x + 5 = 12`.",
            "answer_keywords": ["x = 7", "7"]
        },
        {
            "id": 3,
            "title": "Understanding Functions",
            "explanation": "A function is a rule that takes an input and gives an output. For example, `f(x) = x + 2` means if you put in 3, you get 5 (because 3 + 2 = 5).",
            "question": "If `f(x) = x + 2`, what is `f(4)`?",
            "answer_keywords": ["6"]
        },
        {
            "id": 4,
            "title": "Course Complete!",
            "explanation": "Great job! You've learned the basics of variables, equations, and functions in Algebra 1.",
            "question": None,
            "answer_keywords": []
        }
    ]
}
