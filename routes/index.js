var express = require('express');
var router = express.Router();

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('blog.sqlite3');

const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');

const hostname = 'http://localhost:3000';

/* GET home page. */
router.get('/', function(req, res, next) {
  db.serialize(() => {
    db.all('SELECT * FROM article', (err, rows) => {
      res.render('index', { articles: rows });
    });
  });
});

// createルート
router.get('/create', function(req, res, next) {
  res.render('create');
});

router.post('/create', function(req, res, next) {
  let title = req.body.title;
  let content = req.body.content;
  let date = Date.now().toString();
  let ogp_url = `${hostname}/images/ogp/ogp_${date}.png`;

  //データベースに記事を登録
  db.serialize(() => {
    db.run('INSERT INTO article (title, content, ogp_url) VALUES (?, ?, ?)', title, content, ogp_url);
  });

  //OGP画像を生成
  const canvas = createCanvas(1200, 630);
  const ctx = canvas.getContext('2d');
  //ogp_template.pngを読み込む
  loadImage('public/images/ogp/ogp_template.png').then((image) => {
      ctx.drawImage(image, 0, 0, 1200, 630);
      let fontSize = 60;
      ctx.font = `bold ${fontSize}px 'Arial'`;
      ctx.fillStyle = "black";
      ctx.textAlign = "center";

      //画像の中央にtitleを描画
      //h1の先頭から32文字までを取得
      let titleText = title.slice(0,31);
      //titleが32文字以上の場合は...を付ける
      if(title.length > 32){
          titleText += "...";
      }
      if(titleText.length > 16){
          ctx.fillText(titleText.slice(0,16), canvas.width / 2, canvas.height / 2 - (fontSize * 0.75));
          ctx.fillText(titleText.slice(16), canvas.width / 2, canvas.height / 2 + (fontSize * 0.75));
      }else{
          ctx.fillText(titleText, canvas.width / 2, canvas.height / 2);
      }
    
      // PNG形式で保存
      const out = fs.createWriteStream(`public/images/ogp/ogp_${date}.png`);
      const stream = canvas.createPNGStream();
      stream.pipe(out);
    });
  res.redirect('/');
});


// articleルート
router.get('/article', function(req, res, next) {
  const id = req.query.id;

  db.serialize(() => {
    db.get('SELECT * FROM article WHERE id = ?', id, (err, row) => {
      res.render('article', { article: row });
    });
  });
});


module.exports = router;


