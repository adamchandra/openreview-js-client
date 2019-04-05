var assert = chai.assert;
var should = chai.should();
var expect = chai.expect();


describe('Test value-copied substitution', function () {

  it('should replace fields', function () {

    var invitationReply = {
      'signatures': {
        'description': 'How your identity will be displayed with the above content.',
        'values-regex': '~.*'
      },
      'writers': {
        'description': 'i describe stuff',
        'fake_field': 2332,
        'bool': true,
        'value-copied': '{content.authorids}'
      },
      'content': {
        'first_inner_field': {
          'values-regex': '~.*'
        },
        'second_inner_field': {
          'value-copied': '{content.first_inner_field}'
        },
        'second_signatures': {
          'value-copied': 'signatures'
        },
        'nested': {
          'inner_object': {
            'deeper_object': {
              'value-copied': 'name'
            }
          }
        },
        'authorids': {
          'description': 'Comma separated list of author email addresses, in the same order as above.',
          'order': 3,
          'values-regex': "([a-z0-9_\-\.]{2,}@[a-z0-9_\-\.]{2,}\.[a-z]{2,},){0,}([a-z0-9_\-\.]{2,}@[a-z0-9_\-\.]{2,}\.[a-z]{2,})",
          'required': true
        },
        'student paper': {
          "order": 10,
          "description": "Is this a student paper?",
          "value-radio": ["Yes", "No"]
        }
      }
    };

    var originalNote = {
      'invitation': 'MCZTest/-/submission',
      'signatures': ['~Test_User1'],
      'writers': ['I will be replaced'],
      'name': 'MCZ',
      'content': {
        'first_inner_field': 'i will be copied',
        'second_inner_field': 'i will be replaced',
        'second_signatures': 'I too will be replaced',
        'authorids': ['id1', 'id2'],
        'nested': {
          'inner_object': {
            'deeper_object': 'who am i?'
          }
        }
      }
    };

    var newNote = view.getCopiedValues(originalNote, invitationReply);

    // check that we didn't alter the original note
    originalNote.should.deep.not.equal(newNote);

    // check the fields that should NOT have changed
    newNote.invitation.should.equal(originalNote.invitation);
    newNote.content.authorids.should.eql(originalNote.content.authorids);
    newNote.content.first_inner_field.should.equal(originalNote.content.first_inner_field);

    // check the substitutions

    newNote.writers.should.eql(originalNote.content.authorids);
    newNote.content.second_signatures.should.equal(originalNote.signatures);
    newNote.content.nested.inner_object.deeper_object.should.equal(originalNote.name);
    newNote.content.second_inner_field.should.equal(originalNote.content.first_inner_field);

  });


  it('should replace fields, again', function () {

    // this is an actual invitation that was not working correctly with the previous version
    var invitationReply2 = {

      "rdate": null,
      "tddate": null,
      "web": null,
      "ddate": null,
      "multiReply": null,
      "taskCompletionCount": null,
      "duedate": 1507180500000,
      "tmdate": 1487798650470,
      "id": "auai.org/UAI/2017/-/submission",
      "writers": ["auai.org/UAI/2017"],
      "signatures": ["auai.org/UAI/2017"],
      "readers": ["everyone"],
      "invitees": ["~"],
      "reply": {
        "forum": null,
        "replyto": null,
        "writers": {"value-copied": "{content.authorids}"},
        "signatures": {
          "values-regex": "~.*",
          "description": "How your identity will be displayed with the above content."
        },
        "readers": {
          "description": "The users who will be allowed to read the above content.",
          "values": ["auai.org/UAI/2017", "auai.org/UAI/2017/Program_Co-Chairs"]
        },
        "content": {
          "pdf": {
            "required": true,
            "order": 9,
            "value-regex": "upload",
            "description": "Upload a PDF file that ends with .pdf)"
          },
          "title": {"required": true, "order": 1, "description": "Title of paper.", "value-regex": ".{1,250}"},
          "abstract": {
            "required": true,
            "order": 8,
            "description": "Abstract of paper.",
            "value-regex": "[\\S\\s]{1,5000}"
          },
          "authors": {
            "required": true,
            "order": 2,
            "values-regex": "[^;,\\n]+(,[^,\\n]+)*",
            "description": "Comma separated list of author names, as they appear in the paper."
          },
          "keywords": {
            "order": 6,
            "values-regex": "[^;,\\n]+(,[^,\\n]+)*",
            "description": "Comma separated list of keywords."
          },
          "TL;DR": {
            "required": false,
            "order": 7,
            "description": "\"Too Long; Didn't Read\": a short sentence describing your paper",
            "value-regex": "[^\\n]{0,250}"
          },
          "authorids": {
            "required": true,
            "order": 3,
            "values-regex": "([a-z0-9_\\-\\.]{2,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,},){0,}([a-z0-9_\\-\\.]{2,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,})",
            "description": "Comma separated list of author email addresses, in the same order as above."
          },
          "student paper": {"order": 10, "description": "Is this a student paper?", "value-radio": ["Yes", "No"]},
          "subject_areas": {
            "order": 4,
            "description": "List of areas of expertise.",
            "values-dropdown": ["Algorithms: Approximate Inference", "Algorithms: Belief Propagation", "Algorithms: Distributed and Parallel", "Algorithms: Exact Inference", "Algorithms: Graph Theory", "Algorithms: Heuristics", "Algorithms: Lifted Inference", "Algorithms: MCMC methods", "Algorithms: Optimization", "Algorithms: Other", "Algorithms: Software and Tools", "Applications: Biology", "Applications: Databases", "Applications: Decision Support", "Applications: Diagnosis and Reliability", "Applications: Economics", "Applications: Education", "Applications: General", "Applications: Medicine", "Applications: Planning and Control", "Applications: Privacy and Security", "Applications: Robotics", "Applications: Sensor Data", "Applications: Social Network Analysis", "Applications: Speech", "Applications: Sustainability and Climate", "Applications: Text and Web Data", "Applications: User Models", "Applications: Vision", "Data: Big Data", "Data: Multivariate", "Data: Other", "Data: Relational", "Data: Spatial", "Data: Temporal or Sequential", "Learning: Active Learning", "Learning: Classification", "Learning: Clustering", "Learning: Deep Learning", "Learning: General", "Learning: Nonparametric Bayes", "Learning: Online and Anytime Learning", "Learning: Other", "Learning: Parameter Estimation", "Learning: Probabilistic Generative Models", "Learning: Ranking", "Learning: Recommender Systems", "Learning: Regression", "Learning: Reinforcement Learning", "Learning: Relational Learning", "Learning: Relational Models", "Learning: Scalability", "Learning: Semi-Supervised Learning", "Learning: Structure Learning", "Learning: Structured Prediction", "Learning: Theory", "Learning: Unsupervised", "Methodology: Bayesian Methods", "Methodology: Calibration", "Methodology: Elicitation", "Methodology: Evaluation", "Methodology: Human Expertise and Judgement", "Methodology: Other", "Methodology: Probabilistic Programming", "Models: Bayesian Networks", "Models: Directed Graphical Models", "Models: Dynamic Bayesian Networks", "Models: Markov Decision Processes", "Models: Mixed Graphical Models", "Models: Other", "Models: Relational Models", "Models: Topic Models", "Models: Undirected Graphical Models", "None of the above", "Principles: Causality", "Principles: Cognitive Models", "Principles: Decision Theory", "Principles: Game Theory", "Principles: Information Theory", "Principles: Other", "Principles: Probability Theory", "Principles: Statistical Theory", "Representation: Constraints", "Representation: Dempster-Shafer", "Representation: Fuzzy Logic", "Representation: Influence Diagrams", "Representation: Non-Probabilistic Frameworks", "Representation: Probabilistic"]
          }
        }
      },
      "nonreaders": [],
      "noninvitees": []

    };

    var originalNote2 = {
      'invitation': 'MCZTest/-/submission',
      'signatures': ['~Test_User1'],
      'reply': {
        'writers': ['I will be replaced']
      },
      'name': 'MCZ',
      'content': {
        'authorids': ['id1', 'id2']
      }
    };

    var newNote2 = view.getCopiedValues(originalNote2, invitationReply2);

    // check that we didn't alter the original note
    originalNote2.should.deep.not.equal(newNote2);

    // check the substitution
    newNote2.reply.writers.should.eql(originalNote2.content.authorids);

  });

  it('should replace fields with one values-copied', function () {

    // this is an actual invitation that was not working correctly with the previous version
    var invitationReply = {

      "rdate": null,
      "tddate": null,
      "web": null,
      "ddate": null,
      "multiReply": null,
      "taskCompletionCount": null,
      "duedate": 1507180500000,
      "tmdate": 1487798650470,
      "id": "auai.org/UAI/2017/-/submission",
      "writers": ["auai.org/UAI/2017"],
      "signatures": ["auai.org/UAI/2017"],
      "readers": ["everyone"],
      "invitees": ["~"],
      "reply": {
        "forum": null,
        "replyto": null,
        "writers": {
          "values": []
        },
        "signatures": {
          "values-regex": "~.*",
          "description": "How your identity will be displayed with the above content."
        },
        "readers": {
          "description": "The users who will be allowed to read the above content.",
          "values-copied": ["auai.org/UAI/2017", "auai.org/UAI/2017/Program_Co-Chairs", "{content.authorids}"]
        },
        "content": {
          "pdf": {
            "required": true,
            "order": 9,
            "value-regex": "upload",
            "description": "Upload a PDF file that ends with .pdf)"
          },
          "title": {"required": true, "order": 1, "description": "Title of paper.", "value-regex": ".{1,250}"},
          "abstract": {
            "required": true,
            "order": 8,
            "description": "Abstract of paper.",
            "value-regex": "[\\S\\s]{1,5000}"
          },
          "authors": {
            "required": true,
            "order": 2,
            "values-regex": "[^;,\\n]+(,[^,\\n]+)*",
            "description": "Comma separated list of author names, as they appear in the paper."
          },
          "keywords": {
            "order": 6,
            "values-regex": "[^;,\\n]+(,[^,\\n]+)*",
            "description": "Comma separated list of keywords."
          },
          "TL;DR": {
            "required": false,
            "order": 7,
            "description": "\"Too Long; Didn't Read\": a short sentence describing your paper",
            "value-regex": "[^\\n]{0,250}"
          },
          "authorids": {
            "required": true,
            "order": 3,
            "values-regex": "([a-z0-9_\\-\\.]{2,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,},){0,}([a-z0-9_\\-\\.]{2,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,})",
            "description": "Comma separated list of author email addresses, in the same order as above."
          },
          "student paper": {"order": 10, "description": "Is this a student paper?", "value-radio": ["Yes", "No"]},
          "subject_areas": {
            "order": 4,
            "description": "List of areas of expertise.",
            "values-dropdown": ["Algorithms: Approximate Inference", "Algorithms: Belief Propagation", "Algorithms: Distributed and Parallel", "Algorithms: Exact Inference", "Algorithms: Graph Theory", "Algorithms: Heuristics", "Algorithms: Lifted Inference", "Algorithms: MCMC methods", "Algorithms: Optimization", "Algorithms: Other", "Algorithms: Software and Tools", "Applications: Biology", "Applications: Databases", "Applications: Decision Support", "Applications: Diagnosis and Reliability", "Applications: Economics", "Applications: Education", "Applications: General", "Applications: Medicine", "Applications: Planning and Control", "Applications: Privacy and Security", "Applications: Robotics", "Applications: Sensor Data", "Applications: Social Network Analysis", "Applications: Speech", "Applications: Sustainability and Climate", "Applications: Text and Web Data", "Applications: User Models", "Applications: Vision", "Data: Big Data", "Data: Multivariate", "Data: Other", "Data: Relational", "Data: Spatial", "Data: Temporal or Sequential", "Learning: Active Learning", "Learning: Classification", "Learning: Clustering", "Learning: Deep Learning", "Learning: General", "Learning: Nonparametric Bayes", "Learning: Online and Anytime Learning", "Learning: Other", "Learning: Parameter Estimation", "Learning: Probabilistic Generative Models", "Learning: Ranking", "Learning: Recommender Systems", "Learning: Regression", "Learning: Reinforcement Learning", "Learning: Relational Learning", "Learning: Relational Models", "Learning: Scalability", "Learning: Semi-Supervised Learning", "Learning: Structure Learning", "Learning: Structured Prediction", "Learning: Theory", "Learning: Unsupervised", "Methodology: Bayesian Methods", "Methodology: Calibration", "Methodology: Elicitation", "Methodology: Evaluation", "Methodology: Human Expertise and Judgement", "Methodology: Other", "Methodology: Probabilistic Programming", "Models: Bayesian Networks", "Models: Directed Graphical Models", "Models: Dynamic Bayesian Networks", "Models: Markov Decision Processes", "Models: Mixed Graphical Models", "Models: Other", "Models: Relational Models", "Models: Topic Models", "Models: Undirected Graphical Models", "None of the above", "Principles: Causality", "Principles: Cognitive Models", "Principles: Decision Theory", "Principles: Game Theory", "Principles: Information Theory", "Principles: Other", "Principles: Probability Theory", "Principles: Statistical Theory", "Representation: Constraints", "Representation: Dempster-Shafer", "Representation: Fuzzy Logic", "Representation: Influence Diagrams", "Representation: Non-Probabilistic Frameworks", "Representation: Probabilistic"]
          }
        }
      },
      "nonreaders": [],
      "noninvitees": []

    };

    var originalNote = {
      'invitation': 'MCZTest/-/submission',
      'signatures': ['~Test_User1'],
      'writers': [],
      'readers': [],
      'content': {
        'authorids': ['id1', 'id2']
      }
    };

    var newNote = view.getCopiedValues(originalNote, invitationReply.reply);

    // check that we didn't alter the original note
    originalNote.should.deep.not.equal(newNote);

    // check the substitution
    newNote.readers.should.eql(["auai.org/UAI/2017", "auai.org/UAI/2017/Program_Co-Chairs", 'id1', 'id2']);

  });

  it('should replace fields with two values-copied', function () {

    // this is an actual invitation that was not working correctly with the previous version
    var invitationReply = {

      "rdate": null,
      "tddate": null,
      "web": null,
      "ddate": null,
      "multiReply": null,
      "taskCompletionCount": null,
      "duedate": 1507180500000,
      "tmdate": 1487798650470,
      "id": "auai.org/UAI/2017/-/submission",
      "writers": ["auai.org/UAI/2017"],
      "signatures": ["auai.org/UAI/2017"],
      "readers": ["everyone"],
      "invitees": ["~"],
      "reply": {
        "forum": null,
        "replyto": null,
        "writers": {
          "values": []
        },
        "signatures": {
          "values-regex": "~.*",
          "description": "How your identity will be displayed with the above content."
        },
        "readers": {
          "description": "The users who will be allowed to read the above content.",
          "values-copied": ["auai.org/UAI/2017", "auai.org/UAI/2017/Program_Co-Chairs", "{content.authorids}", "{signatures}"]
        },
        "content": {
          "pdf": {
            "required": true,
            "order": 9,
            "value-regex": "upload",
            "description": "Upload a PDF file that ends with .pdf)"
          },
          "title": {"required": true, "order": 1, "description": "Title of paper.", "value-regex": ".{1,250}"},
          "abstract": {
            "required": true,
            "order": 8,
            "description": "Abstract of paper.",
            "value-regex": "[\\S\\s]{1,5000}"
          },
          "authors": {
            "required": true,
            "order": 2,
            "values-regex": "[^;,\\n]+(,[^,\\n]+)*",
            "description": "Comma separated list of author names, as they appear in the paper."
          },
          "keywords": {
            "order": 6,
            "values-regex": "[^;,\\n]+(,[^,\\n]+)*",
            "description": "Comma separated list of keywords."
          },
          "TL;DR": {
            "required": false,
            "order": 7,
            "description": "\"Too Long; Didn't Read\": a short sentence describing your paper",
            "value-regex": "[^\\n]{0,250}"
          },
          "authorids": {
            "required": true,
            "order": 3,
            "values-regex": "([a-z0-9_\\-\\.]{2,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,},){0,}([a-z0-9_\\-\\.]{2,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,})",
            "description": "Comma separated list of author email addresses, in the same order as above."
          },
          "student paper": {"order": 10, "description": "Is this a student paper?", "value-radio": ["Yes", "No"]},
          "subject_areas": {
            "order": 4,
            "description": "List of areas of expertise.",
            "values-dropdown": ["Algorithms: Approximate Inference", "Algorithms: Belief Propagation", "Algorithms: Distributed and Parallel", "Algorithms: Exact Inference", "Algorithms: Graph Theory", "Algorithms: Heuristics", "Algorithms: Lifted Inference", "Algorithms: MCMC methods", "Algorithms: Optimization", "Algorithms: Other", "Algorithms: Software and Tools", "Applications: Biology", "Applications: Databases", "Applications: Decision Support", "Applications: Diagnosis and Reliability", "Applications: Economics", "Applications: Education", "Applications: General", "Applications: Medicine", "Applications: Planning and Control", "Applications: Privacy and Security", "Applications: Robotics", "Applications: Sensor Data", "Applications: Social Network Analysis", "Applications: Speech", "Applications: Sustainability and Climate", "Applications: Text and Web Data", "Applications: User Models", "Applications: Vision", "Data: Big Data", "Data: Multivariate", "Data: Other", "Data: Relational", "Data: Spatial", "Data: Temporal or Sequential", "Learning: Active Learning", "Learning: Classification", "Learning: Clustering", "Learning: Deep Learning", "Learning: General", "Learning: Nonparametric Bayes", "Learning: Online and Anytime Learning", "Learning: Other", "Learning: Parameter Estimation", "Learning: Probabilistic Generative Models", "Learning: Ranking", "Learning: Recommender Systems", "Learning: Regression", "Learning: Reinforcement Learning", "Learning: Relational Learning", "Learning: Relational Models", "Learning: Scalability", "Learning: Semi-Supervised Learning", "Learning: Structure Learning", "Learning: Structured Prediction", "Learning: Theory", "Learning: Unsupervised", "Methodology: Bayesian Methods", "Methodology: Calibration", "Methodology: Elicitation", "Methodology: Evaluation", "Methodology: Human Expertise and Judgement", "Methodology: Other", "Methodology: Probabilistic Programming", "Models: Bayesian Networks", "Models: Directed Graphical Models", "Models: Dynamic Bayesian Networks", "Models: Markov Decision Processes", "Models: Mixed Graphical Models", "Models: Other", "Models: Relational Models", "Models: Topic Models", "Models: Undirected Graphical Models", "None of the above", "Principles: Causality", "Principles: Cognitive Models", "Principles: Decision Theory", "Principles: Game Theory", "Principles: Information Theory", "Principles: Other", "Principles: Probability Theory", "Principles: Statistical Theory", "Representation: Constraints", "Representation: Dempster-Shafer", "Representation: Fuzzy Logic", "Representation: Influence Diagrams", "Representation: Non-Probabilistic Frameworks", "Representation: Probabilistic"]
          }
        }
      },
      "nonreaders": [],
      "noninvitees": []

    };

    var originalNote = {
      'invitation': 'MCZTest/-/submission',
      'signatures': ['~Test_User1'],
      'writers': [],
      'readers': [],
      'content': {
        'authorids': ['id1', 'id2']
      }
    };

    var newNote = view.getCopiedValues(originalNote, invitationReply.reply);

    // check that we didn't alter the original note
    originalNote.should.deep.not.equal(newNote);

    // check the substitution
    newNote.readers.should.eql(["auai.org/UAI/2017", "auai.org/UAI/2017/Program_Co-Chairs", 'id1', 'id2', '~Test_User1']);

  });

  it('should properly render prettyIds', function () {
    var testId1 = 'cv-foundation.org/CVPR';
    view.prettyId(testId1).should.eql('CVPR');

    var testId2 = 'CV-Foundation.org/CVPR';
    view.prettyId(testId2).should.eql('CV-Foundation CVPR');

    var testId3 = 'ICLR.cc';
    view.prettyId(testId3).should.eql('ICLR');

    var testId4 = 'BNMW_Workshop';
    view.prettyId(testId4).should.eql('BNMW Workshop');

    var testId5 = 'OpenReview.net/Anonymous_Preprint';
    view.prettyId(testId5).should.eql('OpenReview Anonymous Preprint');

    var testId6 = 'reviewer@mail.com';
    view.prettyId(testId6).should.eql('reviewer@mail.com');

    var testId7 = 'bid_score';
    view.prettyId(testId7).should.eql('bid_score');

    var testId8 = 'recommendation_score';
    view.prettyId(testId8).should.eql('recommendation_score');

  });

  it('should properly render invitation prettyIds', function () {

    view.prettyInvitationId('auai.org/UAI/2017/-/Paper1/Submit/Review').should.eql('Submit Review');

    view.prettyInvitationId('auai.org/UAI/2017/-/Paper1/Comment/to_authors').should.eql('Comment to authors');

    view.prettyInvitationId('auai.org/UAI/2017/-/Paper1/Comment/to_(S)PCs').should.eql('Comment to (S)PCs');

    view.prettyInvitationId('ICLR.cc/2017/conference/-/paper186/Add/Revision').should.eql('Add Revision');

    view.prettyInvitationId('ICLR.cc/2017/conference/-/paper93/meta/review').should.eql('meta review');

    view.prettyInvitationId('ICLR.cc/2017/conference/-/paper315/AC/Review/Rating').should.eql('Review Rating');

    view.prettyInvitationId('ICLR.cc/2017/conference/-/paper305/public/comment').should.eql('public comment');

    view.prettyInvitationId('NIPS.cc/2016/Deep_Learning_Symposium/-/recommendation').should.eql('recommendation');

    view.prettyInvitationId('auai.org/UAI/2017/-/Paper13/Review/Open/Comment').should.eql('Open Comment');

    view.prettyInvitationId('ICLR.cc/2018/Conference/-/Paper15/Official_Review').should.eq('Official Review');

    view.prettyInvitationId('ICLR.cc/2019/Conference/-/Paper951/Official_Review/AnonReviewer2/Revision').should.eq('Revision');

    view.prettyInvitationId('ICLR.cc/2019/Conference/-/Paper951/Official_Review/23AnonReviewer23/Revision').should.eq('Revision');

    view.prettyInvitationId('ICLR.cc/2019/Conference/-/Paper951/Official_Review/AnonR23eviewer12/Revision').should.eq('Revision');

    view.prettyInvitationId('ICLR.cc/2019/Conference/-/Paper951/Official_Review/321AnonReviewer/Revision').should.eq('321AnonReviewer Revision');

  });






});
