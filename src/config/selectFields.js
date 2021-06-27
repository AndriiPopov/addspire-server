const clubD =
    'name image questionsCount usersCount notifications admins startConversation __v'

const accountD = 'name image notifications __v'

const questionD =
    'name images votesUp votesDown vote followersCount club date owner reputation answersCount acceptedAnswer bookmarksCount acceptedAnswer commentsCount __v'

const answerD =
    'images votesUp votesDown club date owner reputation question commentsCount __v'

const reputationD =
    'tags club user reputation plusToday minusToday admin banned  __v'

module.exports.selectFields = {
    clubD,
    accountD,
    questionD,
    answerD,
    reputationD,
}
