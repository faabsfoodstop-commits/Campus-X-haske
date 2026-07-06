export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const mockQuestions = [
    {
      id: '1',
      question_text: 'What is the capital of France?',
      options: [
        { id: '1a', option_text: 'Paris', is_correct: true },
        { id: '1b', option_text: 'Lyon', is_correct: false },
        { id: '1c', option_text: 'Marseille', is_correct: false },
        { id: '1d', option_text: 'Nice', is_correct: false }
      ]
    },
    {
      id: '2',
      question_text: 'What is 2 + 2?',
      options: [
        { id: '2a', option_text: '3', is_correct: false },
        { id: '2b', option_text: '4', is_correct: true },
        { id: '2c', option_text: '5', is_correct: false },
        { id: '2d', option_text: '6', is_correct: false }
      ]
    }
  ];

  res.json({
    status: 'success',
    data: {
      round_id: 'round-' + Date.now(),
      questions: mockQuestions,
      timer: 20000
    }
  });
}
