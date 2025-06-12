import { CheckCircleIcon } from "lucide-react";

const FAQ = [
    {
        value: "item-1",
        question: "Why doesn't my APY match the advertised rate on day one?",
        answer: "When you deposit into SuperFund, your earnings (APY) don't start at the full rate right away. That's because we use a \"Yield Ramp-up\" system — built on Euler Earn — to make rates more stable and fair over time.",
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
        answer: "If you're a new depositor, your APY will start low and ramp up over about 7 days. You'll miss a small portion of your first week's yield (around 3 days' worth) because your funds didn't help generate the yield that's already being shared. And the new yield your funds generate also enters the \"slow drip.\" Don't worry — after that ramp-up, you'll earn like everyone else.",
        delay: 0.3
    },
    {
        value: "item-4",
        question: "Here's How We Show Your Earnings:",
        answer: (
            <div className="space-y-3">
                <div>
                    <strong>Vault 30-Day APY:</strong><br />
                    8.40% – The average return experienced by long-term depositors.
                </div>
                <div>
                    <strong>Vault Projected APY:</strong><br />
                    8.35% – Based on our current strategy performance and allocations.
                </div>
                <div>
                    <strong>Your Personal APY:</strong><br />
                    6.87% (example for new user)<br />
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