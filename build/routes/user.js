const auth = require('../middleware/auth');

const express = require('express');

const router = express.Router();
router.post('/', [auth], async (req, res) => {
  try {
    req.user.accountInfo = req.body.value;
    req.user.save();
    res.send({
      success: true
    });
  } catch (ex) {}
});
module.exports = router;