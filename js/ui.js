import { Quiz } from './quiz.js';
import { SUBJECTS } from './config.js';

export class QuizUI {
    constructor() {
        this.quiz = new Quiz();
        this.initializeElements();
        this.setupEventListeners();
        this.populateSubjects();
    }

    initializeElements() {
        this.elements = {
            setupContainer: document.getElementById('setup-container'),
            quizContainer: document.getElementById('quiz-container'),
            questionText: document.getElementById('question-text'),
            optionsContainer: document.getElementById('options-container'),
            nextButton: document.getElementById('next-btn'),
            scoreContainer: document.getElementById('score-container'),
            scoreElement: document.getElementById('score'),
            restartButton: document.getElementById('restart-btn'),
            timerElement: document.getElementById('timer'),
            loader: document.getElementById('loader'),
            subjectSelect: document.getElementById('subject-select'),
            startButton: document.getElementById('start-quiz-btn')
        };
    }

    setupEventListeners() {
        this.elements.startButton.addEventListener('click', () => this.startQuiz());
        this.elements.nextButton.addEventListener('click', () => this.loadNextQuestion());
        this.elements.restartButton.addEventListener('click', () => this.resetQuiz());
    }

    populateSubjects() {
        SUBJECTS.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject.toLowerCase();
            option.textContent = subject;
            this.elements.subjectSelect.appendChild(option);
        });
    }

    startQuiz() {
        const subject = this.elements.subjectSelect.value;
        this.quiz.timeLimit = parseInt(document.getElementById('time-select').value);
        
        if (!subject) {
            alert('Please select a subject');
            return;
        }

        this.elements.setupContainer.classList.add('hidden');
        this.elements.quizContainer.classList.remove('hidden');
        this.quiz.score = 0;
        this.loadNextQuestion();
    }

    resetQuiz() {
        this.elements.scoreContainer.classList.add('hidden');
        this.elements.setupContainer.classList.remove('hidden');
        clearInterval(this.quiz.timer);
    }

    async loadNextQuestion() {
        clearInterval(this.quiz.timer);
        this.elements.nextButton.classList.add('hidden');
        this.elements.loader.classList.remove('hidden');
        this.elements.optionsContainer.innerHTML = '';
        
        const questionData = await this.quiz.generateQuestion(this.elements.subjectSelect.value);
        this.quiz.currentQuestion = questionData;
        
        this.elements.questionText.textContent = questionData.question;
        
        questionData.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.textContent = option;
            button.classList.add('option');
            button.addEventListener('click', () => this.checkAnswer(index));
            this.elements.optionsContainer.appendChild(button);
        });
        
        this.elements.loader.classList.add('hidden');
        
        if (this.quiz.timeLimit > 0) {
            this.startTimer();
        }
    }

    checkAnswer(selectedIndex) {
        clearInterval(this.quiz.timer);
        const options = this.elements.optionsContainer.querySelectorAll('.option');
        
        options.forEach(option => {
            option.disabled = true;
        });
        
        if (selectedIndex === this.quiz.currentQuestion.correctIndex) {
            options[selectedIndex].classList.add('correct');
            this.quiz.score++;
        } else {
            options[selectedIndex].classList.add('wrong');
            options[this.quiz.currentQuestion.correctIndex].classList.add('correct');
        }
        
        this.showExplanation();
        this.elements.nextButton.classList.remove('hidden');
    }

    startTimer() {
        let timeLeft = this.quiz.timeLimit;
        this.elements.timerElement.textContent = `Time left: ${timeLeft}s`;
        
        this.quiz.timer = setInterval(() => {
            timeLeft--;
            this.elements.timerElement.textContent = `Time left: ${timeLeft}s`;
            
            if (timeLeft <= 0) {
                clearInterval(this.quiz.timer);
                const options = this.elements.optionsContainer.querySelectorAll('.option');
                options.forEach(option => option.disabled = true);
                options[this.quiz.currentQuestion.correctIndex].classList.add('correct');
                this.showExplanation();
                this.elements.nextButton.classList.remove('hidden');
            }
        }, 1000);
    }

    async showExplanation() {
        const explanation = await this.quiz.getExplanation(
            this.quiz.currentQuestion.question,
            this.quiz.currentQuestion.options,
            this.quiz.currentQuestion.correctIndex
        );

        const explanationDiv = document.createElement('div');
        explanationDiv.className = 'explanation';
        explanationDiv.innerHTML = `
            <h3>Explanation</h3>
            <div class="explanation-content">
                <pre>${explanation}</pre>
            </div>
            <div class="doubt-section">
                <h4>Have a doubt?</h4>
                <div class="doubt-input-container">
                    <textarea 
                        placeholder="Type your doubt here related to this question..."
                        class="doubt-input"
                    ></textarea>
                    <button class="ask-doubt-btn">Ask Doubt</button>
                </div>
                <div class="doubt-answer hidden"></div>
            </div>
        `;

        const existingExplanation = document.querySelector('.explanation');
        if (existingExplanation) {
            existingExplanation.remove();
        }

        this.elements.optionsContainer.after(explanationDiv);
        this.setupDoubtHandling(explanationDiv);
    }

    setupDoubtHandling(explanationDiv) {
        const doubtBtn = explanationDiv.querySelector('.ask-doubt-btn');
        const doubtInput = explanationDiv.querySelector('.doubt-input');
        const doubtAnswer = explanationDiv.querySelector('.doubt-answer');

        doubtBtn.addEventListener('click', async () => {
            const doubt = doubtInput.value.trim();
            if (!doubt) return;

            doubtBtn.disabled = true;
            doubtBtn.textContent = 'Getting answer...';
            
            const answer = await this.quiz.askDoubt(doubt, this.quiz.currentQuestion.question);
            
            doubtAnswer.innerHTML = `
                <h4>Answer to your doubt:</h4>
                <p>${answer}</p>
            `;
            doubtAnswer.classList.remove('hidden');
            
            doubtBtn.disabled = false;
            doubtBtn.textContent = 'Ask Doubt';
        });
    }
}