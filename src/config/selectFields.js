const clubD =
    'date name views image questionsCount postsCount adminsCount reputationsCount notifications admins startConversation tags followersCount location clubAddress global images pinned __v'

const accountD = 'reputationsCount __v'

const questionD =
    'name bestAnswer post description images views votesUp votesDown vote followersCount club date owner reputation answersCount acceptedAnswer acceptedAnswer commentsCount tags  count  global location __v'

const answerD =
    'images views description votesUp votesDown club date owner reputation question commentsCount __v'

const reputationD =
    'label tags views club owner reputation plusToday minusToday admin banned starred image clubName tags name member global location answersCount questionsCount postsCount commentsCount __v'

const imageDataD = 'url votesDownCount votesUpCount commentsCount __v'

module.exports.selectFields = {
    clubD,
    accountD,
    questionD,
    answerD,
    reputationD,
    imageDataD,
}
