const clubD =
    'name views image questionsCount adminsCount reputationsCount notifications admins startConversation tags __v'

const accountD = 'name image reputationsCount __v'

const questionD =
    'name images views votesUp votesDown vote followersCount club date owner reputation answersCount acceptedAnswer acceptedAnswer commentsCount tags __v'

const answerD =
    'images views description votesUp votesDown club date owner reputation question commentsCount __v'

const reputationD =
    'tags views club owner reputation plusToday minusToday admin banned starred image clubName clubImage clubTags profileTags name member  __v'

module.exports.selectFields = {
    clubD,
    accountD,
    questionD,
    answerD,
    reputationD,
}
