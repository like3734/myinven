const express = require('express');
const router = express.Router();
const aws = require('aws-sdk');
aws.config.loadFromPath('./config/aws_config.json');
const pool = require('../../config/db_pool');
const jwt = require('jsonwebtoken');

// writer edit view
router.get('/:num', (req,res) => {
  return new Promise((fulfill, reject) => {
    pool.getConnection((err, connection) => {
      if(err) reject(err);
      else fulfill(connection);
    })
  })
  .catch(err => {
    res.status(500).send({ message: 'getConnection err : ' + err});
  })
  .then(connection => {
    return new Promise((fulfill, reject) => {
      let query = 'select writer_name, writer_belong, writer_email, writer_position, writer_image from writer where writer_id = ? ';
      connection.query(query, req.params.num, (err, data) => {
        if(err) reject([err, connection]);
        else fulfill([data, connection]);
      })
    })
  })
  .catch(([err, connection]) => {
    res.status(400).send({ result: [], message: 'select writer query err : ' + err});
    connection.release();
  })
  .then(([data, connection]) => {
    let query = 'select profile_title, profile_fromtime, profile_untiltime, profile_exp from profile where profile_writer = ?';
    connection.query(query, req.params.num, (err, data2) => {
      if(err){
        res.status(400).send({ result: [], message: 'select profile query err : ' + err});
      }
      else{
        let writerSet = {
          name: data[0].writer_name,
          belong: data[0].writer_belong,
          email: data[0].writer_email,
          position: data[0].writer_position,
          image: data[0].writer_image
        };
        let profileSet = [];
        for(let i=0; i<data2.length; i++){
          let profile = {
            title: data2[i].profile_title,
            fromtime: data2[i].profile_fromtime,
            untiltime: data2[i].profile_untiltime,
            exp: data2[i].profile_exp
          };
          profileSet.push(profile);
        }
        res.status(200).send({ writer: writerSet, profile: profileSet, message: 'ok' });
      }
      connection.release();
    })
  })
})

// writer edit (data url)
router.post('/', (req, res) => {
  return new Promise((fulfill,reject) => {
    pool.getConnection((err, connection) => {
      if(err) reject(err);
      else fulfill(connection);
    });
  })
  .catch(err => {
    res.status(500).send({ message: 'getConnection err : ' + err });
  })
  .then(connection => {
    return new Promise((fulfill, reject) => {
      connection.beginTransaction(err => {
        if(err) reject(err);
        else fulfill(connection);
      });
    });
  })
  .catch(err => {
    res.status(500).send({ message : 'beginTransaction err : ' + err});
    connection.release();
  })
  .then(connection => {
    return new Promise((fulfill, reject) => {
      let token = req.headers.token;
      jwt.verify(token, req.app.get('jwt-secret'), (err, decoded) => {
        if(err) reject([err, connection]);
        else fulfill(connection);
      });
    })
  })
  .catch(([err, connection]) => {
    res.status(403).send({ message: ' jwt err : ' + err});
    connection.rollback();
    connection.release();
  })
  .then(connection => {
    return new Promise((fulfill, reject) => {
      let dataSet = {
        writer_name: req.body.name,
        writer_image: req.body.image,
        writer_email: req.body.email,
        writer_belong: req.body.belong,
        writer_position: req.body.position
      };
      let query = 'update writer set ? where writer_id = ? ';
      connection.query(query, [dataSet,req.body.id], (err, data) => {
        if(err) reject([err, connection]);
        else fulfill(connection);
      });
    })
  })
  .catch(([err, connection]) => {
    res.status(400).send({ message: ' insert writer err : ' + err });
    connection.rollback();
    connection.release();
  })
  .then(connection => {
    return new Promise((fulfill, reject) => {
      let query = 'delete from profile where profile_writer = ? ';
      connection.query(query, req.body.id, (err, data) => {
        if(err) reject([err, connection]);
        else fulfill(connection);
      })
    })
  })
  .catch(([err, connection]) => {
    res.status(400).send({ message: ' delete query err' + err });
    connection.rollback();
    connection.release();
  })
  .then(connection => {
      let new_writer = req.body.id;
      let arySet = [];
      arySet = JSON.parse(req.body.profile);
      let profileSet = [];
      for(let i=0; i<arySet.length; i++){
        let profile = {
          profile_title: arySet[i].title,
          profile_fromtime: arySet[i].fromtime,
          profile_untiltime: arySet[i].untiltime,
          profile_exp: arySet[i].exp,
          profile_writer: new_writer
        };
        profileSet.push(profile);
      }
      let query = 'insert into profile set ? ';
      for(let j=0; j<profileSet.length; j++){
        if(j !== profileSet.length-1){
          connection.query(query, profileSet[j], (err, data) => {
              if(err){
                res.status(400).send({ message: 'fail' });
                connection.rollback();
                connection.release();
              }
          });
        }
        else{
          connection.query(query, profileSet[j], (err, data) => {
              if(err){
                res.status(400).send({ message: 'fail' });
                connection.rollback();
                connection.release();
              }
              else{
                res.status(201).send({ message: 'ok' });
                connection.commit();
                connection.release();
              }
          });
        }
      }
  })
})

// // writer edit request ( data file)
// router.post('/', upload.single('image'), (req, res) => {
//   return new Promise((fulfill,reject) => {
//     pool.getConnection((err, connection) => {
//       if(err) reject(err);
//       else fulfill(connection);
//     });
//   })
//   .catch(err => {
//     res.status(500).send({ message: 'getConnection err : ' + err });
//   })
//   .then(connection => {
//     return new Promise((fulfill, reject) => {
//       connection.beginTransaction(err => {
//         if(err) reject(err);
//         else fulfill(connection);
//       });
//     });
//   })
//   .catch(err => {
//     res.status(500).send({ message : 'beginTransaction err : ' + err});
//     connection.release();
//   })
//   .then(connection => {
//     return new Promise((fulfill, reject) => {
//       let token = req.headers.token;
//       jwt.verify(token, req.app.get('jwt-secret'), (err, decoded) => {
//         if(err) reject([err, connection]);
//         else fulfill(connection);
//       });
//     })
//   })
//   .catch(([err, connection]) => {
//     res.status(403).send({ message: ' jwt err : ' + err});
//     connection.rollback();
//     connection.release();
//   })
//   .then(connection => {
//     return new Promise((fulfill, reject) => {
//       let dataSet = {
//         writer_name: req.body.name,
//         writer_image: req.file ? req.file.location : null,
//         writer_email: req.body.email,
//         writer_belong: req.body.belong,
//         writer_position: req.body.position
//       };
//       let query = 'update writer set ? where writer_id = ? ';
//       connection.query(query, [dataSet,req.body.id], (err, data) => {
//         if(err) reject([err, connection]);
//         else fulfill(connection);
//       });
//     })
//   })
//   .catch(([err, connection]) => {
//     res.status(400).send({ message: ' insert writer err : ' + err });
//     connection.rollback();
//     connection.release();
//   })
//   .then(connection => {
//     return new Promise((fulfill, reject) => {
//       let query = 'delete from profile where profile_writer = ? ';
//       connection.query(query, req.body.id, (err, data) => {
//         if(err) reject([err, connection]);
//         else fulfill(connection);
//       })
//     })
//   })
//   .catch(([err, connection]) => {
//     res.status(400).send({ message: ' delete query err' + err });
//     connection.rollback();
//     connection.release();
//   })
//   .then(connection => {
//       let new_writer = req.body.id;
//       let arySet = [];
//       let profileSet = [];
//       for(let i=0; i<req.body.profile.length; i++){
//         let testSet = JSON.parse(req.body.profile[i]);
//         arySet.push(testSet);
//       }
//       for(let i=0; i<arySet.length; i++){
//         let profile = {
//           profile_title: arySet[i].title,
//           profile_fromtime: arySet[i].fromtime,
//           profile_untiltime: arySet[i].untiltime,
//           profile_exp: arySet[i].exp,
//           profile_writer: new_writer
//         };
//         profileSet.push(profile);
//       }
//       let query = 'insert into profile set ? ';
//       for(let j=0; j<profileSet.length; j++){
//         if(j !== profileSet.length-1){
//           connection.query(query, profileSet[j], (err, data) => {
//               if(err){
//                 res.status(400).send({ message: 'fail' });
//                 connection.rollback();
//                 connection.release();
//               }
//           });
//         }
//         else{
//           connection.query(query, profileSet[j], (err, data) => {
//               if(err){
//                 res.status(400).send({ message: 'fail' });
//                 connection.rollback();
//                 connection.release();
//               }
//               else{
//                 res.status(201).send({ message: 'ok' });
//                 connection.commit();
//                 connection.release();
//               }
//           });
//         }
//       }
//   })
// })

module.exports = router;
