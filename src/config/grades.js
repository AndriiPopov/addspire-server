// Grades depending on the reputation.

module.exports = {
    grade0: {
        max: 0,
        plus: 0,
        minus: 0,
        ban: 1,
    },
    grade1: {
        min: 0,
        max: 10,
        plus: 5,
        minus: 0,
    },
    grade2: {
        min: 10,
        max: 50,
        plus: 10,
        minus: 1,
    },
    grade3: {
        min: 50,
        max: 100,
        plus: 20,
        minus: 5,
    },
    grade4: {
        min: 100,
        max: 200,
        plus: 30,
        minus: 10,
    },
    grade5: {
        min: 200,
        max: 500,
        plus: 50,
        minus: 20,
    },
    grade6: {
        min: 500,
        max: 1000,
        plus: 100,
        minus: 30,
    },
    grade7: {
        min: 1000,
        plus: 200,
        minus: 100,
    },
}
