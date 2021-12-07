const clubD =
    'date name views image questionsCount adminsCount reputationsCount notifications admins startConversation tags followersCount location clubAddress global images __v'

const accountD = 'reputationsCount __v'

const questionD =
    'name bestAnswer description images views votesUp votesDown vote followersCount club date owner reputation answersCount acceptedAnswer acceptedAnswer commentsCount tags bonusCreatedDate bonusPaid bonusCoins count  clubAddress global location __v'

const answerD =
    'images views description votesUp votesDown club date owner reputation question commentsCount __v'

const reputationD =
    'tags views club owner reputation plusToday minusToday admin banned starred image clubName clubImage tags name member clubAddress global location __v'

module.exports.selectFields = {
    clubD,
    accountD,
    questionD,
    answerD,
    reputationD,
}
