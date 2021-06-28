const clubD =
    'name views image questionsCount usersCount notifications admins startConversation __v'

const accountD = 'name views image notifications __v'

const questionD =
    'name images views votesUp votesDown vote followersCount club date owner reputation answersCount acceptedAnswer acceptedAnswer commentsCount __v'

const answerD =
    'images views description votesUp votesDown club date owner reputation question commentsCount __v'

const reputationD =
    'tags views club user reputation plusToday minusToday admin banned  __v'

module.exports.selectFields = {
    clubD,
    accountD,
    questionD,
    answerD,
    reputationD,
}
