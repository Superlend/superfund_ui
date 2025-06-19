import { CheckCircleIcon } from "lucide-react";

const FAQ = [
    {
        value: "item-1",
        question: "Why doesn't my APY match the advertised rate on day one?",
        answer: "When you deposit into SuperFund, your yield starts accruing immediately — but it is released gradually over a short period. This design helps ensure rewards are distributed fairly across all users, preventing anyone from gaming the system.",
        delay: 0.1
    },
    {
        value: "item-2",
        question: "What's Yield Ramp-up?",
        answer: "Think of SuperFund like a candy machine 🍬 that gives out candies (yield) slowly and evenly, so everyone gets a fair share — not all at once. When the vault earns yield, it's added to a pool and released gradually over 7 days. This prevents sudden spikes and keeps returns smooth for everyone.",
        delay: 0.2
    },
    {
        value: "item-3",
        question: "What This Means For You",
        answer: "When you join SuperFund, you immediately start receiving a share of the interest already earned by the vault over the past few days. This is part of our fair distribution model, where yield is spread out over time and shared across all participants. Because of this, if you withdraw early, you may miss out on some of the interest that your deposit helped generate — just as you benefited from past yield when you joined. Staying longer helps you earn your fair share and supports steady, reliable returns for everyone.",
        delay: 0.3
    },
    {
        value: "item-4",
        question: "Here's How We Show Your Earnings:",
        answer: (
            <div className="space-y-3">
                <div>
                    <strong>Vault 30-Day APY:</strong><br />
                    8.40% – The average return earned by long-term depositors over the past month.
                </div>
                <div>
                    <strong>Vault Projected APY:</strong><br />
                    8.35% – The estimated rate based on current strategies and protocol performance.
                </div>
                <div>
                    <strong>Your Personal APY:</strong><br />
                    6.87% – What you’re currently earning based on the vault&apos;s fair distribution model.
                    <br />
                    🕒 <em>Note: You're in your 7-day ramp-up. Returns will increase daily and match the vault APY after that.</em>
                </div>
            </div>
        ),
        delay: 0.4
    },
    {
        value: "item-5",
        question: "Why We Do This",
        answer: (
            <ul className="space-y-2 list-disc list-inside">
                <li> <CheckCircleIcon className="w-4 h-4 inline-block mr-2 text-green-500" /> To keep returns fair and stable for everyone.</li>
                <li> <CheckCircleIcon className="w-4 h-4 inline-block mr-2 text-green-500" /> To avoid sudden jumps when large yields are harvested.</li>
                <li> <CheckCircleIcon className="w-4 h-4 inline-block mr-2 text-green-500" /> To give users a smooth and reliable experience.</li>
            </ul>
        ),
        delay: 0.5
    },
    {
        value: "item-6",
        question: "Want to Learn More?",
        answer: (
            <div>
                Check out our quick explainer video! 🎥
                <br />
                <a
                    href="#"
                    className="text-secondary-500 hover:text-secondary-500/80 underline mt-2 inline-block"
                    onClick={(e) => {
                        e.preventDefault();
                        window.open("https://youtu.be/IISyN2WDQho", "_blank");
                    }}
                >
                    Watch Explainer Video →
                </a>
            </div>
        ),
        delay: 0.6
    }
]

export default FAQ;