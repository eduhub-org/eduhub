exports.echo = async (req, res) => {
  console.log("Called echo with environment", process.env.TEST_ENV);
  res.json({
    echo: req.url,
  });
};
