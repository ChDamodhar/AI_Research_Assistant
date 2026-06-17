import { Paper, UserProfileType } from './types';

export const DEFAULT_USER: UserProfileType = {
  fullName: 'Dr. Aris Thorne',
  email: 'a.thorne@academic.inst',
  role: 'Senior Researcher',
  version: 'v1.0.4',
  lastChangedPasswordText: 'Password last changed 4 months ago'
};

export const INITIAL_PAPERS: Paper[] = [
  {
    id: 'attention-is-all-you-need',
    title: 'Attention Is All You Need.pdf',
    type: 'PDF',
    uploadedAt: 'Oct 12, 2023',
    status: 'analyzed',
    authors: 'Vaswani, A., Shazeer, N., Parmar, N., Uszkoreit, J., Jones, L., Gomez, A. N., Kaiser, Ł. & Polosukhin, I.',
    journal: 'NIPS 2017',
    abstract: 'This seminal paper introduces the Transformer, a novel network architecture based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. The authors demonstrate that these models are superior in quality while being more parallelizable and requiring significantly less time to train.',
    contributions: [
      'Introduction of Multi-Head Self-Attention mechanisms.',
      'Replacement of LSTM/GRU layers with positional encodings.',
      'Achieved SOTA on WMT 2014 translation tasks.'
    ],
    metrics: {
      gpus: '8x Nvidia P100',
      time: '3.5 Days',
      score: '28.4 BLEU'
    },
    progress: 94,
    citations: [
      { id: '1', author: 'Vaswani, A.', year: 2017, title: 'Attention is All You Need', link: 'https://arxiv.org/abs/1706.03762' },
      { id: '2', author: 'Sutskever, I.', year: 2014, title: 'Sequence to Sequence Learning with Neural Networks', link: 'https://arxiv.org/abs/1409.3215' },
      { id: '3', author: 'Bahdanau, D.', year: 2015, title: 'Neural Machine Translation by Jointly Learning to Align and Translate', link: 'https://arxiv.org/abs/1409.0473' },
      { id: '4', author: 'Hochreiter, S.', year: 1997, title: 'Long Short-Term Memory', link: 'https://dl.acm.org/doi/10.1162/neco.1997.9.8.1735' },
      { id: '5', author: 'Kingma, D. P.', year: 2014, title: 'Adam: A Method for Stochastic Optimization', link: 'https://arxiv.org/abs/1412.6980' }
    ],
    figures: [
      {
        title: 'Figure 1: The Transformer',
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBEv6dhmyc-0r_mT05riGqaDvNrVWho_eKiJoZIAeNg-woHqIJyUnT0m6QVild_M8vvAJxNw0hoT318teDDVWv1Qn8OtFHGYEhtsW7fkfDAWaEDtN5h1Ot7nZtZMxDkKAdlDkSGmGIz8u4caX6vZYpx8MErK70mhNhx4CVDMmovF_CViVubd2Nzx-bZwaxYJbOYW8EBD5EkPnNHix83Ij3_5BmxJWHneqn-CJA_JUycybHnJYERWYxdamp_jTNIpdDB9fLtIlteW24',
        caption: 'The Transformer - model architecture. Left: Encoder. Right: Decoder.'
      }
    ],
    qna: [
      {
        id: 'msg-1',
        sender: 'ai',
        timestamp: '10:42 AM',
        text: 'Analysis of the provided document is complete. I have indexed 14 pages of technical content regarding the Transformer architecture. How can I assist your research today?'
      },
      {
        id: 'msg-2',
        sender: 'user',
        timestamp: '10:43 AM',
        text: 'What dataset was used for the base experimental results in this paper?'
      },
      {
        id: 'msg-3',
        sender: 'ai',
        timestamp: '10:43 AM',
        text: 'The authors used the WMT 2014 English-German dataset for their base experimental results. Specifics include:\n\n• 4.5 million sentence pairs\n• BPE encoding with 37,000 tokens\n• WMT 2014 English-French was also used for scaling tests',
        citations: ['Page 7, Section 5.1', 'Table 2: BLEU Scores']
      },
      {
        id: 'msg-4',
        sender: 'user',
        timestamp: '10:45 AM',
        text: "Summarize the key differences between the 'Base' and 'Big' models mentioned in the results section."
      }
    ],
    report: {
      title: 'Synthesis Report: Attention Transformers in Modern NLP',
      executiveSummary: '"The transition toward attention-based sequence modeling removes architectural limitations of recurrence, accelerating deep parallelization across specialized hardware arrays..."\n\nThis synthesis maps the core execution metrics of self-attention blocks. Multi-headed mechanisms allow concurrent projections of inputs, improving lexical capture over large sentence sequences.',
      futureScope: [
        'Hardware acceleration of positional encodings.',
        'Exploration of sparse gating routines on heads.',
        'Integration of bidirectional context layers.'
      ],
      sourcesCount: 5,
      confidence: '98.8%',
      wordCount: '~1,200 words',
      collaborators: [
        { name: 'Dr. John Thorne', initials: 'JT', color: 'bg-primary-container' },
        { name: 'Prof. Sarah King', initials: 'SK', color: 'bg-secondary' }
      ],
      previewUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD-D5CoXAG7-6OCofZbsnkMnlqXKLtjx5-o4Fj6JvYim-tIIjH5iqdfB-2UWY0c__spItD-tYqVJxS66Kkq4FLg2O1w8KwttEQQjxOmmREVhwuf3grEZ_eKrv8XesAHip5MpWKcES37f-JIs1KwkiEvwJUYsX7J0Nm6Fz_nWWMPH5DYQ_QNXRujOnTYgXm7jgQPEEKnXY20N4p7vRq7nEVg-8u9p-VLCU-yT-6a_bmM6We94aNnOFWIVODuK3lRlh8Hs_R8O71zhvU'
    }
  },
  {
    id: 'bert-pre-training',
    title: 'BERT Pre-training.pdf',
    type: 'PDF',
    uploadedAt: 'Nov 05, 2023',
    status: 'analyzed',
    authors: 'Devlin, J., Chang, M. W., Lee, K. & Toutanova, K.',
    journal: 'NAACL 2019',
    abstract: 'This paper introduces BERT (Bidirectional Encoder Representations from Transformers), which pre-trains deep bidirectional representations from unlabeled text by jointly conditioning on both left and right context in all layers.',
    contributions: [
      'Masked Language Modeling (MLM) standard for bidirectionality.',
      'Next Sentence Prediction (NSP) task context pre-training.',
      'Unified architecture applicable to both sentence-level and token-level tasks.'
    ],
    metrics: {
      gpus: '16x Cloud TPUs',
      time: '4.0 Days',
      score: '82.1 GLUE Avg'
    },
    progress: 100,
    citations: [
      { id: '1', author: 'Devlin, J.', year: 2018, title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding', link: 'https://arxiv.org/abs/1810.04805' },
      { id: '2', author: 'Peters, M.', year: 2018, title: 'Deep contextualized word representations (ELMo)', link: 'https://arxiv.org/abs/1802.05365' },
      { id: '3', author: 'Radford, A.', year: 2018, title: 'Improving Language Understanding by Generative Pre-Training (GPT)', link: 'https://openai.com/research' }
    ],
    figures: [
      {
        title: 'Figure 1: BERT Pre-training & Fine-tuning',
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBEv6dhmyc-0r_mT05riGqaDvNrVWho_eKiJoZIAeNg-woHqIJyUnT0m6QVild_M8vvAJxNw0hoT318teDDVWv1Qn8OtFHGYEhtsW7fkfDAWaEDtN5h1Ot7nZtZMxDkKAdlDkSGmGIz8u4caX6vZYpx8MErK70mhNhx4CVDMmovF_CViVubd2Nzx-bZwaxYJbOYW8EBD5EkPnNHix83Ij3_5BmxJWHneqn-CJA_JUycybHnJYERWYxdamp_jTNIpdDB9fLtIlteW24',
        caption: 'Pre-training and fine-tuning graphical pipelines for BERT.'
      }
    ],
    qna: [
      {
        id: 'bert-qna-1',
        sender: 'ai',
        timestamp: '11:15 AM',
        text: 'BERT model layers are fully loaded into the RAG database. Ask any query regarding BERT-Base or BERT-Large.'
      }
    ],
    report: {
      title: 'Synthesis Report: Bidirectional Context Modeling',
      executiveSummary: '"By training language patterns bidirectionally via masking, BERT establishes dense semantic representations that can be fine-tuned with a single final-layer adapter..."',
      futureScope: [
        'Fine-tuning optimizations on down-stream task embeddings.',
        'Distillation of the encoder layer arrays.'
      ],
      sourcesCount: 3,
      confidence: '95.2%',
      wordCount: '~890 words',
      collaborators: [
        { name: 'Dr. John Thorne', initials: 'JT', color: 'bg-primary-container' }
      ],
      previewUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD-D5CoXAG7-6OCofZbsnkMnlqXKLtjx5-o4Fj6JvYim-tIIjH5iqdfB-2UWY0c__spItD-tYqVJxS66Kkq4FLg2O1w8KwttEQQjxOmmREVhwuf3grEZ_eKrv8XesAHip5MpWKcES37f-JIs1KwkiEvwJUYsX7J0Nm6Fz_nWWMPH5DYQ_QNXRujOnTYgXm7jgQPEEKnXY20N4p7vRq7nEVg-8u9p-VLCU-yT-6a_bmM6We94aNnOFWIVODuK3lRlh8Hs_R8O71zhvU'
    }
  },
  {
    id: 'scalable-neural-architecture-search',
    title: 'Scalable neural architecture search with generative hyperparameter optimization',
    type: 'PDF',
    uploadedAt: 'Jun 16, 2024',
    status: 'analyzed',
    authors: 'Thorne, A., King, S., et al.',
    journal: 'NATURE BIOTECHNOLOGY',
    abstract: 'The primary aim of this study is to address the computational bottleneck in Neural Architecture Search (NAS) by introducing a generative model that predicts optimal hyperparameters without exhaustive iterative testing. The research focuses on reducing training time by 40% while maintaining a Top-1 accuracy rate exceeding 92% on complex vision datasets.',
    contributions: [
      '38.4% reduction in GPU wall-clock hours compared to baseline NAS-Bench-201.',
      'Discovered 12 novel subgraph patterns that improve gradient flow in deep residuals.',
      'Successfully transferred learned parameters to Edge-AI devices with < 2% performance decay.'
    ],
    metrics: {
      gpus: '32x NVIDIA A100',
      time: '12 Days',
      score: '94.2% Top-1 Acc'
    },
    progress: 100,
    citations: [
      { id: '1', author: 'Li et al.', year: 2022, title: 'Differentiable Architecture Search Benchmarks', link: 'https://arxiv.org/abs/2201.00001' },
      { id: '2', author: 'DeepMind AlphaFold Tech Report', year: 2021, title: 'Highly accurate protein structure prediction', link: 'https://nature.com' },
      { id: '3', author: 'Zhang, S.', year: 2023, title: 'NAS-v3 Open Review Forums', link: 'https://openreview.net' }
    ],
    figures: [
      {
        title: 'Figure 1: Generative NAS Flowchart',
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBEv6dhmyc-0r_mT05riGqaDvNrVWho_eKiJoZIAeNg-woHqIJyUnT0m6QVild_M8vvAJxNw0hoT318teDDVWv1Qn8OtFHGYEhtsW7fkfDAWaEDtN5h1Ot7nZtZMxDkKAdlDkSGmGIz8u4caX6vZYpx8MErK70mhNhx4CVDMmovF_CViVubd2Nzx-bZwaxYJbOYW8EBD5EkPnNHix83Ij3_5BmxJWHneqn-CJA_JUycybHnJYERWYxdamp_jTNIpdDB9fLtIlteW24',
        caption: 'Visual workflow of the proposed stochastic hyperparameter predictor model.'
      }
    ],
    qna: [
      {
        id: 'nas-qna-1',
        sender: 'ai',
        timestamp: '1:00 PM',
        text: 'Hello, Dr. Thorne. The Nature Biotechnology paper synthesis is generated. We discovered a 38.4% reduction in GPU cycles.'
      }
    ],
    report: {
      title: 'Synthesis Module v4.2: Final Report Generation',
      executiveSummary: '"The transition toward quantum-resistant cryptographic standards is accelerated by the integration of lattice-based algorithms within existing cloud infrastructures..."\n\nThis report delineates the current trajectory of cybersecurity protocols under the looming threat of Shor\'s algorithm. By cross-referencing recent publications from 2023-2024, our analysis reveals a 22% increase in institutional adoption of post-quantum standards.',
      futureScope: [
        'Integration of hardware-accelerated NTT modules for signature verification.',
        'Standardization of hybrid classical-quantum handshake mechanisms.',
        'Longitudinal study on the performance overhead of XMSS in mobile edge computing.'
      ],
      sourcesCount: 14,
      confidence: '98.4%',
      wordCount: '~2,450 words',
      collaborators: [
        { name: 'Dr. John Thorne', initials: 'JT', color: 'bg-primary-container' },
        { name: 'Prof. Sarah King', initials: 'SK', color: 'bg-secondary' }
      ],
      previewUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD-D5CoXAG7-6OCofZbsnkMnlqXKLtjx5-o4Fj6JvYim-tIIjH5iqdfB-2UWY0c__spItD-tYqVJxS66Kkq4FLg2O1w8KwttEQQjxOmmREVhwuf3grEZ_eKrv8XesAHip5MpWKcES37f-JIs1KwkiEvwJUYsX7J0Nm6Fz_nWWMPH5DYQ_QNXRujOnTYgXm7jgQPEEKnXY20N4p7vRq7nEVg-8u9p-VLCU-yT-6a_bmM6We94aNnOFWIVODuK3lRlh8Hs_R8O71zhvU'
    }
  },
  {
    id: 'gpt-3-analysis',
    title: 'GPT-3-Analysis.docx',
    type: 'DOCX',
    uploadedAt: 'Jan 20, 2024',
    status: 'analyzed',
    authors: 'Brown, T. B., Mann, B., Ryder, N., Subbiah, M., Kaplan, J., et al.',
    journal: 'NeurIPS 2020',
    abstract: 'This paper studies whether scaling pre-trained autoregressive language models yields generalist AI systems with zero-shot, prompt-based task execution capabilities across hundreds of language tasks.',
    contributions: [
      'Evaluation on zero-shot, one-shot, and few-shot translation/cloze tasks.',
      'Analysis of scaling laws showing power-law trends in compute versus loss components.',
      'Identified societal risks including bias generation.'
    ],
    metrics: {
      gpus: 'V100 Cluster',
      time: 'Months',
      score: '175B Parameters'
    },
    progress: 100,
    citations: [
      { id: '1', author: 'Radford, A.', year: 2019, title: 'Language Models are Unsupervised Multitask Learners (GPT-2)', link: 'https://openai.com' }
    ],
    figures: [],
    qna: [],
    report: {
      title: 'Synthesis Report: Autoregressive Scaling Limits',
      executiveSummary: '"Autoregressive decoders reach high linguistic parity as neural parameter volumes scale towards the hundreds of billions..."',
      futureScope: [
        'Analysis of latency overheads in sparse token decoding.'
      ],
      sourcesCount: 1,
      confidence: '99.0%',
      wordCount: '~500 words',
      collaborators: [],
      previewUrl: ''
    }
  },
  {
    id: 'resnet-implementation',
    title: 'ResNet-Implementation.pdf',
    type: 'PDF',
    uploadedAt: 'Feb 15, 2024',
    status: 'analyzed',
    authors: 'He, K., Zhang, X., Ren, S. & Sun, J.',
    journal: 'CVPR 2016',
    abstract: 'This paper presents a residual learning framework to ease the training of networks that are substantially deeper than those previously used. The authors reformulate the layers as learning residual functions with reference to the layer inputs.',
    contributions: [
      'Introduction of skip connections to solve degrading accuracy bottlenecks.',
      'First successful training of depth models exceeding 100 and 1000 layers.',
      'SOTA achievement on ImageNet ILSVRC 2015 Classification and CVPR detections.'
    ],
    metrics: {
      gpus: '8x GPUs',
      time: '2.0-3.0 Weeks',
      score: '3.57% Top-5 Error'
    },
    progress: 100,
    citations: [
      { id: '1', author: 'He, K.', year: 2015, title: 'Deep Residual Learning for Image Recognition', link: 'https://arxiv.org/abs/1512.03385' },
      { id: '2', author: 'Simonyan, K.', year: 2014, title: 'Very Deep Convolutional Networks for Large-Scale Image Recognition', link: 'https://arxiv.org/abs/1409.1556' }
    ],
    figures: [],
    qna: [],
    report: {
      title: 'Synthesis Report: Recurrent Degrading in Hierarchies',
      executiveSummary: '"By integrating shortcut maps, residual layers learn correction vectors over base identity layers, easing mathematical convergence at extreme depths..."',
      futureScope: [
        'Transference to lightweight visual feature extractors.'
      ],
      sourcesCount: 2,
      confidence: '97.2%',
      wordCount: '~750 words',
      collaborators: [],
      previewUrl: ''
    }
  }
];
