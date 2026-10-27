/* ============================================================
   LEARNOVA — course catalogue
   ------------------------------------------------------------
   A hand-checked set of real, free-to-learn courses. Every card
   links to the provider's own page. Metadata is editorial: the
   "Learnova score" is our own quality signal, not a provider
   rating, and learner reviews are collected separately.

   To add a course, copy a record and give it a unique id.
   ============================================================ */
(function () {
  "use strict";

  const PROVIDERS = {
    freecodecamp: {
      name: "freeCodeCamp", initials: "fCC", color: "#0A0A23", text: "#FFFFFF",
      type: "Nonprofit", url: "https://www.freecodecamp.org/",
      about: "A nonprofit community that has helped millions of people learn to code for free, with certifications built around real projects."
    },
    harvard: {
      name: "Harvard University", initials: "HU", color: "#A51C30", text: "#FFFFFF",
      type: "University", url: "https://www.harvard.edu/",
      about: "Harvard's public courses bring its teaching to learners everywhere, most famously through the CS50 family of computer science courses."
    },
    mit: {
      name: "MIT OpenCourseWare", initials: "MIT", color: "#A31F34", text: "#FFFFFF",
      type: "University", url: "https://ocw.mit.edu/",
      about: "Free, openly licensed lecture notes, videos, exams, and assignments from thousands of MIT courses."
    },
    khan: {
      name: "Khan Academy", initials: "KA", color: "#14BF96", text: "#062E28",
      type: "Nonprofit", url: "https://www.khanacademy.org/",
      about: "A nonprofit learning platform with free lessons, practice, and mastery tracking in maths, science, humanities, and more."
    },
    coursera: {
      name: "Coursera", initials: "C", color: "#0056D2", text: "#FFFFFF",
      type: "Platform", url: "https://www.coursera.org/",
      about: "Courses and specializations from universities and companies. Most courses can be audited for free; certificates are usually paid."
    },
    edx: {
      name: "edX", initials: "edX", color: "#02262B", text: "#FFFFFF",
      type: "Platform", url: "https://www.edx.org/",
      about: "Courses from universities and institutions worldwide. Audit tracks are free; verified certificates are paid."
    },
    kaggle: {
      name: "Kaggle", initials: "K", color: "#20BEFF", text: "#052A3A",
      type: "Platform", url: "https://www.kaggle.com/learn",
      about: "Short, practical data science and machine learning courses built by practitioners, with free certificates."
    },
    google: {
      name: "Google", initials: "G", color: "#4285F4", text: "#FFFFFF",
      type: "Company", url: "https://developers.google.com/",
      about: "Google's developer education resources, including machine learning and cloud courses."
    },
    huggingface: {
      name: "Hugging Face", initials: "HF", color: "#FFD21E", text: "#1A1A1A",
      type: "Company", url: "https://huggingface.co/",
      about: "The open machine learning community behind Transformers, datasets, and a growing set of free courses."
    },
    fastai: {
      name: "fast.ai", initials: "fa", color: "#0B6E4F", text: "#FFFFFF",
      type: "Nonprofit", url: "https://www.fast.ai/",
      about: "Practical deep learning education that gets coders building working models from the first lesson."
    },
    helsinki: {
      name: "University of Helsinki", initials: "UH", color: "#002FA7", text: "#FFFFFF",
      type: "University", url: "https://www.helsinki.fi/en",
      about: "Finland's largest university, and the home of Full Stack Open — one of the most respected free web development courses."
    },
    odin: {
      name: "The Odin Project", initials: "TOP", color: "#0F172A", text: "#FFFFFF",
      type: "Open source", url: "https://www.theodinproject.com/",
      about: "A free, open-source full-stack curriculum built by working developers, centred on projects rather than videos."
    },
    yale: {
      name: "Yale University", initials: "Y", color: "#00356B", text: "#FFFFFF",
      type: "University", url: "https://oyc.yale.edu/",
      about: "Yale Open Courses publishes complete introductory courses — lectures, readings, and exams — free to the world."
    },
    hubspot: {
      name: "HubSpot Academy", initials: "H", color: "#FF7A59", text: "#1F130F",
      type: "Company", url: "https://academy.hubspot.com/",
      about: "Free marketing, sales, and business courses with certifications recognised by many employers."
    },
    figma: {
      name: "Figma", initials: "F", color: "#A259FF", text: "#FFFFFF",
      type: "Company", url: "https://www.figma.com/",
      about: "Design resources and tutorials from the team behind the collaborative interface design tool."
    },
    canva: {
      name: "Canva", initials: "C", color: "#00C4CC", text: "#062B2D",
      type: "Company", url: "https://www.canva.com/",
      about: "Free design courses, tutorials, and templates from Canva's design school."
    },
    duolingo: {
      name: "Duolingo", initials: "D", color: "#58CC02", text: "#172B04",
      type: "Company", url: "https://www.duolingo.com/",
      about: "A gamified language learning platform with free courses in dozens of languages."
    },
    bbc: {
      name: "BBC Learning English", initials: "BBC", color: "#BB1919", text: "#FFFFFF",
      type: "Broadcaster", url: "https://www.bbc.co.uk/learningenglish/",
      about: "Free English lessons, videos, and audio from the BBC, covering everyday, business, and academic English."
    },
    britishcouncil: {
      name: "British Council", initials: "BC", color: "#00247D", text: "#FFFFFF",
      type: "Nonprofit", url: "https://learnenglish.britishcouncil.org/",
      about: "Free English learning resources and exercises from the UK's international cultural organisation."
    },
    cisco: {
      name: "Cisco Networking Academy", initials: "C", color: "#1BA0D7", text: "#FFFFFF",
      type: "Company", url: "https://www.netacad.com/",
      about: "Free networking, cybersecurity, and programming courses with hands-on labs."
    },
    linux: {
      name: "Linux Foundation", initials: "LF", color: "#003A4D", text: "#FFFFFF",
      type: "Nonprofit", url: "https://training.linuxfoundation.org/",
      about: "Training from the organisation that supports Linux and a large open-source ecosystem."
    },
    microsoft: {
      name: "Microsoft Learn", initials: "M", color: "#0078D4", text: "#FFFFFF",
      type: "Company", url: "https://learn.microsoft.com/",
      about: "Free, hands-on learning paths for Microsoft technologies, from C# to Azure."
    },
    android: {
      name: "Android Developers", initials: "A", color: "#3DDC84", text: "#073042",
      type: "Company", url: "https://developer.android.com/",
      about: "Official Android courses and codelabs for building apps with Kotlin and Jetpack Compose."
    },
    unity: {
      name: "Unity Learn", initials: "U", color: "#222C37", text: "#FFFFFF",
      type: "Company", url: "https://learn.unity.com/",
      about: "Free tutorials, projects, and learning pathways for the Unity game engine."
    },
    crashcourse: {
      name: "CrashCourse", initials: "CC", color: "#E94E1B", text: "#FFFFFF",
      type: "YouTube", url: "https://www.youtube.com/@crashcourse",
      about: "Fast-paced educational series on history, science, literature, and more — free on YouTube."
    },
    justinguitar: {
      name: "JustinGuitar", initials: "JG", color: "#F5A623", text: "#2A1B00",
      type: "Independent", url: "https://www.justinguitar.com/",
      about: "A complete, free beginner guitar course from one of the internet's best-loved guitar teachers."
    },
    musictheory: {
      name: "musictheory.net", initials: "MT", color: "#2D3748", text: "#FFFFFF",
      type: "Independent", url: "https://www.musictheory.net/",
      about: "Clear, free music theory lessons and exercises for beginners and beyond."
    },
    nptel: {
      name: "NPTEL", initials: "N", color: "#B91C1C", text: "#FFFFFF",
      type: "University consortium", url: "https://nptel.ac.in/",
      about: "Free engineering and science courses from Indian Institutes of Technology, with optional paid certification exams.",
      liveSearch: {
        host: "nptel.ac.in",
        freeMode: "always",
        freeLabel: "Free course",
        freeNote: "Course content is free; optional certification exams have a fee.",
        freeUrl: "https://nptel.ac.in/courses"
      }
    },
    codewithharry: {
      name: "CodeWithHarry", initials: "CWH", color: "#111827", text: "#FFFFFF",
      type: "YouTube", url: "https://www.youtube.com/@CodeWithHarry",
      about: "Popular Hindi-language programming tutorials and project-based courses for Indian learners."
    },
    stanford: {
      name: "Stanford Online", initials: "S", color: "#8C1515", text: "#FFFFFF",
      type: "University", url: "https://online.stanford.edu/",
      about: "Stanford's online courses and free lecture materials, including courses hosted on Coursera and edX."
    },
    udemy: {
      name: "Udemy", initials: "U", color: "#A435F0", text: "#FFFFFF",
      type: "Platform", url: "https://www.udemy.com/",
      about: "A large course marketplace with thousands of free courses alongside paid ones. The live provider search only returns free-marked Udemy pages.",
      liveSearch: {
        host: "udemy.com",
        allowSubdomains: false,
        pathPrefixes: ["/course/", "/topic/", "/courses/free/"],
        freeMode: "filter",
        freePathOnly: true,
        freePathPattern: "(^|[/-])free([/-]|$)",
        freeLabel: "Free course",
        freeNote: "Only Udemy pages marked free are included; paid courses are excluded.",
        freeUrl: "https://www.udemy.com/courses/free/"
      }
    },
    skillshare: {
      name: "Skillshare", initials: "S", color: "#002333", text: "#FFFFFF",
      type: "Platform", url: "https://www.skillshare.com/",
      about: "Creative and professional classes. Skillshare no longer has a permanent free tier, but new learners can explore the library during a free trial.",
      liveSearch: {
        host: "skillshare.com",
        allowSubdomains: false,
        pathPrefixes: ["/classes/", "/en/classes/", "/browse/", "/en/browse/"],
        pathExcludes: ["/pricing", "/join/"],
        freeMode: "trial",
        freeLabel: "Free trial access",
        freeNote: "Classes are accessible during Skillshare's free trial; a paid membership is required afterwards.",
        freeUrl: "https://www.skillshare.com/en/join/premium"
      }
    },
    linkedinlearning: {
      name: "LinkedIn Learning", initials: "in", color: "#0A66C2", text: "#FFFFFF",
      type: "Platform", url: "https://www.linkedin.com/learning/",
      about: "Professional skills courses from LinkedIn. Some courses are free, and a trial may be available; the full library requires a subscription.",
      liveSearch: {
        host: "linkedin.com",
        searchHost: "linkedin.com/learning",
        allowSubdomains: false,
        pathPrefixes: ["/learning/"],
        pathPattern: "^/learning/(paths/[^/]+|[^/]+)$",
        freeMode: "trial",
        freeLabel: "Free trial access",
        freeNote: "LinkedIn Learning includes some free courses and trial access; most of the library is subscription-based.",
        freeUrl: "https://www.linkedin.com/learning/"
      }
    },
    domestika: {
      name: "Domestika", initials: "D", color: "#E4252C", text: "#FFFFFF",
      type: "Platform", url: "https://www.domestika.org/",
      about: "Creative courses from independent professionals. Domestika publishes a rotating collection of free courses alongside its paid catalogue.",
      liveSearch: {
        host: "domestika.org",
        allowSubdomains: false,
        pathPrefixes: ["/en/courses/", "/courses/"],
        pathExcludes: ["/plus"],
        freeMode: "filter",
        freeTitleOnly: true,
        freeLabel: "Free course",
        freeNote: "Only Domestika pages marked free are included; paid and Plus-only courses are excluded.",
        freeUrl: "https://www.domestika.org/keeponcreating",
        fallbackTitle: "Free online courses — Domestika",
        fallbackNote: "No topic-specific free page matched. Open Domestika's official free-course collection."
      }
    },
    alison: {
      name: "Alison", initials: "A", color: "#0B7A5C", text: "#FFFFFF",
      type: "Platform", url: "https://alison.com/",
      about: "Free online courses with optional paid certificates and upgrades. Alison's course library is free to study.",
      liveSearch: {
        host: "alison.com",
        allowSubdomains: false,
        pathPrefixes: ["/course/"],
        freeMode: "always",
        freeLabel: "Free course",
        freeNote: "Alison courses are free to study; certificates and upgrades are optional.",
        freeUrl: "https://alison.com/courses"
      }
    },
    swayam: {
      name: "SWAYAM", initials: "SW", color: "#E85D04", text: "#FFFFFF",
      type: "Government", url: "https://swayam.gov.in/",
      about: "India's government-backed MOOC platform, offering free university and school courses. Optional proctored exams may have a fee.",
      liveSearch: {
        host: "swayam.gov.in",
        allowSubdomains: false,
        pathPrefixes: ["/explorer", "/nd1_", "/nd2_", "/nd3_", "/course"],
        freeMode: "always",
        freeLabel: "Free course",
        freeNote: "SWAYAM course content is free; optional exams and credits may have a fee.",
        freeUrl: "https://swayam.gov.in/explorer",
        fallbackTitle: "SWAYAM course catalogue",
        fallbackNote: "No topic-specific course page matched in the open index. Search the official SWAYAM catalogue."
      }
    },
    upgrad: {
      name: "upGrad", initials: "uG", color: "#D81B60", text: "#FFFFFF",
      type: "Platform", url: "https://www.upgrad.com/",
      about: "Career-focused programs plus a catalogue of free short courses with certificates. Full degree and executive programs are paid.",
      liveSearch: {
        host: "upgrad.com",
        allowSubdomains: false,
        pathPrefixes: ["/free-courses/"],
        freeMode: "filter",
        freePathPattern: "^/free-courses/",
        freeLabel: "Free course",
        freeNote: "Only upGrad free-course pages are included; paid programs are excluded.",
        freeUrl: "https://www.upgrad.com/free-courses/"
      }
    },
    unacademy: {
      name: "Unacademy", initials: "U", color: "#0F9D58", text: "#FFFFFF",
      type: "Platform", url: "https://unacademy.com/",
      about: "India's test-prep and skills platform, with free live classes and resources alongside paid subscriptions and batches.",
      liveSearch: {
        host: "unacademy.com",
        allowSubdomains: false,
        pathPrefixes: ["/goal/", "/free"],
        pathPattern: "^(/goal/.*/classes|/free)",
        searchSuffix: "free class",
        freeMode: "filter",
        freePhrase: "\\bfree\\b[^.]{0,40}\\bclass",
        freeLabel: "Free class",
        freeNote: "Only free classes and resources are included; subscription-only content is excluded.",
        freeUrl: "https://unacademy.com/goal/-/HVZIZ/classes",
        fallbackTitle: "Free classes — Unacademy",
        fallbackNote: "No topic-specific free class matched. Open Unacademy's free class catalogue."
      }
    },
    physicswallah: {
      name: "Physics Wallah", initials: "PW", color: "#6D28D9", text: "#FFFFFF",
      type: "Platform", url: "https://www.pw.live/",
      about: "Indian exam-prep and skills platform with free lectures, batches, notes, and YouTube content. Some structured batches are paid.",
      liveSearch: {
        host: "pw.live",
        allowSubdomains: false,
        pathPrefixes: ["/learners/", "/study-v2", "/free"],
        pathExcludes: ["/pwskills/", "/gyaane", "/store", "/books"],
        searchSuffix: "free lecture",
        freeMode: "filter",
        freePhrase: "\\bfree\\b[^.]{0,40}\\b(lecture|class|batch|resource|course)",
        freeLabel: "Free resource",
        freeNote: "Only free lectures, batches, and resources are included; paid batches are excluded.",
        freeUrl: "https://www.pw.live/study-v2",
        fallbackTitle: "Free lectures and resources — Physics Wallah",
        fallbackNote: "No topic-specific free page matched. Open Physics Wallah's study catalogue."
      }
    },
    udacity: {
      name: "Udacity", initials: "U", color: "#01B3E3", text: "#FFFFFF",
      type: "Platform", url: "https://www.udacity.com/",
      about: "Technical courses and career programs. Udacity publishes a free course collection alongside its paid Nanodegrees.",
      liveSearch: {
        host: "udacity.com",
        allowSubdomains: false,
        pathPrefixes: ["/course/", "/course-collection/free"],
        pathPattern: "^(/course/(?!.*(?:nanodegree|--nd\\d))|/course-collection/free)",
        freeMode: "always",
        freeLabel: "Free course",
        freeNote: "Only Udacity free courses and collections are included; Nanodegrees are paid.",
        freeUrl: "https://www.udacity.com/course-collection/free-udacity-courses"
      }
    }
  };

  const LIVE_PROVIDER_IDS = [
    "udemy", "skillshare", "linkedinlearning", "domestika", "alison", "swayam",
    "nptel", "upgrad", "unacademy", "physicswallah", "udacity"
  ];

  const SUBJECTS = [
    { id: "computer-science", name: "Computer Science", icon: "🖥️", c1: "#1B1F4B", c2: "#4F5BD5", blurb: "How computers, systems, and software work." },
    { id: "programming", name: "Programming", icon: "⌨️", c1: "#0F766E", c2: "#14B8A6", blurb: "Write code and build real projects." },
    { id: "data-science", name: "Data Science", icon: "📊", c1: "#4338CA", c2: "#8B5CF6", blurb: "Turn data into insight and decisions." },
    { id: "mathematics", name: "Mathematics", icon: "📐", c1: "#B45309", c2: "#F59E0B", blurb: "From algebra to calculus and beyond." },
    { id: "science", name: "Science", icon: "🔬", c1: "#047857", c2: "#34D399", blurb: "Physics, chemistry, biology, and space." },
    { id: "business", name: "Business", icon: "💼", c1: "#1E40AF", c2: "#3B82F6", blurb: "Finance, marketing, and management." },
    { id: "design", name: "Design", icon: "🎨", c1: "#BE185D", c2: "#F472B6", blurb: "UX, graphics, photography, and visual craft." },
    { id: "health", name: "Health & Psychology", icon: "🧠", c1: "#15803D", c2: "#84CC16", blurb: "Understand the mind and the body." },
    { id: "languages", name: "Languages", icon: "🌍", c1: "#C2410C", c2: "#FB923C", blurb: "Speak, write, and understand new languages." },
    { id: "humanities", name: "Humanities", icon: "🏛️", c1: "#6D28D9", c2: "#A78BFA", blurb: "History, philosophy, literature, and ideas." },
    { id: "career", name: "Career & Study Skills", icon: "🚀", c1: "#0369A1", c2: "#38BDF8", blurb: "Learn faster and work smarter." },
    { id: "music", name: "Music & Arts", icon: "🎵", c1: "#A21CAF", c2: "#E879F9", blurb: "Instruments, theory, and creative practice." }
  ];

  const COURSES = [
    /* ---------------- Computer Science ---------------- */
    {
      id: "cs50x",
      title: "CS50x: Introduction to Computer Science",
      provider: "harvard", institution: "Harvard University", instructor: "David J. Malan",
      subject: "computer-science", level: "Beginner", language: "English",
      durationHours: 108, durationLabel: "12 weeks", weekly: "6–9 hrs/week",
      price: "free", certificate: "free", score: 4.9, popularity: 100, added: "2024-01-12",
      featured: true, url: "https://cs50.harvard.edu/x/",
      short: "Harvard's legendary introduction to computer science — from Scratch and C to Python, SQL, and web apps.",
      description: "CS50x is Harvard's introduction to the intellectual enterprises of computer science and the art of programming. You start with binary and Scratch, build a foundation in C, then move through algorithms, data structures, Python, SQL, and full-stack web development with Flask and JavaScript. It is demanding but famously supportive, with short lectures, walkthroughs, problem sets, and a final project.",
      skills: ["C", "Python", "SQL", "Algorithms", "Data structures", "Web development"],
      syllabus: ["Scratch: visual programming and computational thinking", "C: data types, memory, arrays, and algorithms", "Algorithms: searching, sorting, recursion, and asymptotics", "Memory: pointers, dynamic allocation, and file I/O", "Python: syntax, libraries, and problem solving", "SQL: relational databases and querying", "HTML, CSS, JavaScript, and Flask", "Final project: build and present your own application"],
      requirements: "No prior programming experience required. Comfort with basic algebra helps.",
      audience: "Beginners who want a rigorous, project-based foundation in computer science."
    },
    {
      id: "mit-6006",
      title: "Introduction to Algorithms",
      provider: "mit", institution: "MIT OpenCourseWare", instructor: "Erik Demaine, Jason Ku, Justin Solomon",
      subject: "computer-science", level: "Intermediate", language: "English",
      durationHours: 40, durationLabel: "24 lectures", weekly: "Self-paced",
      price: "free", certificate: "none", score: 4.8, popularity: 92, added: "2024-02-03",
      featured: false, url: "https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/",
      short: "A rigorous tour of data structures and algorithms, from hashing and sorting to graphs and dynamic programming.",
      description: "This MIT course covers the design and analysis of algorithms that power real software. You will learn how to reason about running time, choose the right data structure, and solve problems with divide-and-conquer, graph algorithms, and dynamic programming. Full lecture videos, problem sets, and exams are available on OpenCourseWare.",
      skills: ["Algorithms", "Data structures", "Dynamic programming", "Graphs", "Complexity analysis", "Problem solving"],
      syllabus: ["Document distance and algorithm analysis", "Peak finding and binary search", "Sorting and heaps", "Hashing and dictionaries", "Binary trees and AVL trees", "Graph search: BFS and DFS", "Shortest paths and minimum spanning trees", "Dynamic programming", "Advanced graph algorithms", "Final exam review"],
      requirements: "Comfort with programming in Python and basic discrete mathematics.",
      audience: "Learners who already code and want a deeper, university-level understanding of algorithms."
    },
    {
      id: "missing-semester",
      title: "The Missing Semester of Your CS Education",
      provider: "mit", institution: "MIT", instructor: "Anish Athalye, Jon Gjengset, Jose Javier Gonzalez Ortiz",
      subject: "computer-science", level: "Beginner", language: "English",
      durationHours: 12, durationLabel: "11 lectures", weekly: "Self-paced",
      price: "free", certificate: "none", score: 4.8, popularity: 85, added: "2024-03-18",
      featured: false, url: "https://missing.csail.mit.edu/",
      short: "The practical computing skills no CS degree teaches: shell, editors, Git, debugging, and more.",
      description: "Most computer science courses teach theory but skip the tools that make you productive. This MIT class fills the gap: command-line fluency, version control, debugging, profiling, and scripting. Each lecture comes with exercises and notes you can use immediately on your own machine.",
      skills: ["Shell", "Git", "Debugging", "Profiling", "Scripting", "Security"],
      syllabus: ["Course overview and the shell", "Shell tools and scripting", "Data wrangling", "Command-line environments", "Version control with Git", "Debugging and profiling", "Metaprogramming", "Security and cryptography", "Potpourri and Q&A"],
      requirements: "A computer with a Unix-like terminal (macOS, Linux, or WSL on Windows) is ideal.",
      audience: "Students and self-taught developers who want to work faster at the command line."
    },
    {
      id: "princeton-algorithms",
      title: "Algorithms, Part I",
      provider: "coursera", institution: "Princeton University", instructor: "Robert Sedgewick, Kevin Wayne",
      subject: "computer-science", level: "Intermediate", language: "English",
      durationHours: 60, durationLabel: "6 weeks", weekly: "6–8 hrs/week",
      price: "audit", certificate: "paid", score: 4.8, popularity: 90, added: "2024-04-09",
      featured: false, url: "https://www.coursera.org/learn/algorithms-part1",
      short: "Princeton's classic algorithms course: sorting, searching, graphs, and the analysis behind efficient code.",
      description: "Algorithms, Part I covers the fundamental algorithms and data structures every programmer should know. Lectures combine clear explanations with real implementations, and programming assignments let you test your code against large datasets. The course is a cornerstone of many computer science programmes.",
      skills: ["Sorting", "Searching", "Graphs", "Data structures", "Java", "Algorithm analysis"],
      syllabus: ["Union-find and dynamic connectivity", "Analysis of algorithms", "Stacks, queues, and bags", "Elementary sorts", "Merge sort and quicksort", "Priority queues and heapsort", "Symbol tables and binary search trees", "Balanced search trees", "Hash tables", "Graph search and shortest paths"],
      requirements: "Basic programming knowledge in Java or another language; some familiarity with loops, arrays, and recursion.",
      audience: "Programmers preparing for technical interviews or deeper computer science study."
    },
    {
      id: "cs50-cyber",
      title: "CS50's Introduction to Cybersecurity",
      provider: "harvard", institution: "Harvard University", instructor: "David J. Malan",
      subject: "computer-science", level: "Beginner", language: "English",
      durationHours: 30, durationLabel: "5 weeks", weekly: "3–6 hrs/week",
      price: "free", certificate: "free", score: 4.7, popularity: 81, added: "2024-06-22",
      featured: false, url: "https://cs50.harvard.edu/cybersecurity/",
      short: "Learn how attacks work and how to defend systems, data, and privacy — from passwords to encryption.",
      description: "This CS50 course introduces the ideas behind cybersecurity without assuming a technical background. You will examine how accounts are compromised, how data is protected, and how privacy is eroded. Short lectures and hands-on problem sets make abstract security concepts concrete.",
      skills: ["Passwords", "Authentication", "Encryption", "Privacy", "Threat modelling", "Security hygiene"],
      syllabus: ["Securing accounts and passwords", "Securing data and encryption", "Securing systems and software", "Securing the internet", "Securing privacy", "Capstone: audit a real scenario"],
      requirements: "No programming experience required.",
      audience: "Anyone who wants a practical, non-technical grounding in digital security."
    },
    {
      id: "cisco-networking",
      title: "Networking Basics",
      provider: "cisco", institution: "Cisco Networking Academy",
      subject: "computer-science", level: "Beginner", language: "English",
      durationHours: 25, durationLabel: "Self-paced", weekly: "~25 hours",
      price: "free", certificate: "paid", score: 4.6, popularity: 78, added: "2024-08-14",
      featured: false, url: "https://www.netacad.com/courses/networking-basics",
      short: "A hands-on introduction to how networks move data — from cables and IP addressing to routers and wireless.",
      description: "Networking Basics explains what happens when you send a message across a network. Through interactive labs you will explore network models, IP addressing, Ethernet, routing, and wireless connectivity. It is the first step in Cisco's networking pathway and a friendly entry point for IT careers.",
      skills: ["Networking", "IP addressing", "Ethernet", "Routing", "Wireless", "Troubleshooting"],
      syllabus: ["Communicating over a network", "Network models and protocols", "IP addressing and subnetting", "Ethernet and switching", "Routing between networks", "Wireless and mobile networks", "Network security basics", "Hands-on Packet Tracer labs"],
      requirements: "No prior networking experience needed.",
      audience: "Beginners exploring IT support, networking, or cybersecurity careers."
    },
    {
      id: "linux-intro",
      title: "Introduction to Linux",
      provider: "linux", institution: "The Linux Foundation",
      subject: "computer-science", level: "Beginner", language: "English",
      durationHours: 40, durationLabel: "40–60 hours", weekly: "Self-paced",
      price: "free", certificate: "paid", score: 4.7, popularity: 83, added: "2024-09-05",
      featured: false, url: "https://training.linuxfoundation.org/training/introduction-to-linux/",
      short: "Get comfortable with Linux: the command line, file systems, users, permissions, and essential tools.",
      description: "This course takes you from opening a terminal to managing a Linux system with confidence. You will learn the file hierarchy, permissions, processes, package management, and basic networking, with plenty of commands to practise. It is designed for people preparing for Linux Foundation certifications or everyday server work.",
      skills: ["Linux", "Command line", "File systems", "Permissions", "Processes", "Package management"],
      syllabus: ["Linux philosophy and distributions", "The command line and shell", "Files, directories, and permissions", "Users and groups", "Processes and system services", "Package management", "Networking basics", "Storage and file systems"],
      requirements: "A computer where you can install Linux or run a virtual machine.",
      audience: "Aspiring system administrators, developers, and anyone moving from Windows or macOS to Linux."
    },
    {
      id: "mit-6824",
      title: "Distributed Systems",
      provider: "mit", institution: "MIT", instructor: "Robert Morris",
      subject: "computer-science", level: "Advanced", language: "English",
      durationHours: 60, durationLabel: "Self-paced course", weekly: "12–15 hrs/week",
      price: "free", certificate: "none", score: 4.8, popularity: 76, added: "2025-01-20",
      featured: false, url: "https://pdos.csail.mit.edu/6.824/",
      short: "Build and reason about the systems behind reliable cloud infrastructure: replication, consensus, and fault tolerance.",
      description: "MIT 6.824 is a challenging, project-heavy course on distributed systems. You will study replication, consistency, consensus, and fault tolerance, then implement core pieces of a distributed system in Go. Lecture notes, papers, labs, and exams are publicly available.",
      skills: ["Distributed systems", "Consensus", "Raft", "Replication", "Go", "Fault tolerance"],
      syllabus: ["Introduction to distributed systems", "RPC and threads", "GFS and primary-backup replication", "Primary-backup and VMware FT", "Raft and consensus", "Linearizability", "ZooKeeper and caching", "Distributed transactions", "Spark and scalable analytics", "Final project and exams"],
      requirements: "Strong programming ability, comfort with concurrency, and some operating systems knowledge.",
      audience: "Advanced students and engineers working on backend or infrastructure systems."
    },

    /* ---------------- Programming ---------------- */
    {
      id: "fcc-responsive",
      title: "Responsive Web Design",
      provider: "freecodecamp", institution: "freeCodeCamp",
      subject: "programming", level: "Beginner", language: "English",
      durationHours: 300, durationLabel: "~300 hours", weekly: "Self-paced",
      price: "free", certificate: "free", score: 4.8, popularity: 96, added: "2024-01-25",
      featured: true, url: "https://www.freecodecamp.org/learn/2022/responsive-web-design/",
      short: "Learn HTML and CSS by building real pages — then earn a free certification.",
      description: "This freeCodeCamp certification starts with the structure of a web page and ends with a portfolio you can show employers. Interactive lessons cover HTML semantics, CSS selectors, accessibility, flexbox, grid, and responsive design. You complete five projects to earn the certificate.",
      skills: ["HTML", "CSS", "Flexbox", "CSS Grid", "Accessibility", "Responsive design"],
      syllabus: ["Learn HTML by building a cat photo app", "Learn basic CSS", "Learn CSS colors and variables", "Learn accessibility", "Learn typography", "Learn flexbox", "Learn CSS grid", "Build a survey form", "Build a tribute page", "Build a landing page", "Build a documentation page", "Build a personal portfolio"],
      requirements: "A browser and a willingness to type code. No prior experience needed.",
      audience: "Absolute beginners who want a structured, project-based start in web development."
    },
    {
      id: "fcc-js",
      title: "JavaScript Algorithms and Data Structures",
      provider: "freecodecamp", institution: "freeCodeCamp",
      subject: "programming", level: "Beginner", language: "English",
      durationHours: 300, durationLabel: "~300 hours", weekly: "Self-paced",
      price: "free", certificate: "free", score: 4.8, popularity: 95, added: "2024-01-25",
      featured: false, url: "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/",
      short: "Master the JavaScript fundamentals behind every interactive website, with projects and a free certificate.",
      description: "This certification takes you from variables and functions to objects, regular expressions, functional programming, and classic data structures. Along the way you build small projects and finish with five algorithm challenges. Everything runs in the browser and is completely free.",
      skills: ["JavaScript", "ES6", "Regular expressions", "Objects", "Functional programming", "Algorithms"],
      syllabus: ["Basic JavaScript", "ES6", "Regular expressions", "Debugging", "Basic data structures", "Object-oriented programming", "Functional programming", "Intermediate algorithm scripting", "Palindrome checker", "Roman numeral converter", "Caesar's cipher", "Telephone number validator", "Cash register"],
      requirements: "Basic HTML and CSS help, but this course starts JavaScript from scratch.",
      audience: "Beginners ready to move from static pages to interactive applications."
    },
    {
      id: "fullstackopen",
      title: "Full Stack Open",
      provider: "helsinki", institution: "University of Helsinki", instructor: "Matti Luukkainen",
      subject: "programming", level: "Intermediate", language: "English",
      durationHours: 150, durationLabel: "Self-paced", weekly: "5–20 hrs/week",
      price: "free", certificate: "free", score: 4.9, popularity: 89, added: "2024-02-15",
      featured: false, url: "https://fullstackopen.com/en/",
      short: "A modern, project-based full-stack course: React, Node, GraphQL, TypeScript, testing, and deployment.",
      description: "Full Stack Open is a free course from the University of Helsinki that teaches modern JavaScript-based web development. You build a series of applications with React, Node.js, Express, MongoDB, and GraphQL, learning testing, authentication, and deployment along the way. It is known for its high-quality exercises and real-world focus.",
      skills: ["React", "Node.js", "Express", "MongoDB", "GraphQL", "TypeScript", "Testing", "CI/CD"],
      syllabus: ["React fundamentals", "Communicating with the server", "Programming a server with Node.js and Express", "Testing Express servers", "Testing React apps", "Advanced state management", "React Router and styling", "GraphQL", "TypeScript", "CI/CD and containers", "React Native"],
      requirements: "Comfort with JavaScript, HTML, CSS, and using the command line.",
      audience: "Developers who know the basics and want to build and deploy complete web applications."
    },
    {
      id: "odin-foundations",
      title: "The Odin Project: Foundations",
      provider: "odin", institution: "The Odin Project",
      subject: "programming", level: "Beginner", language: "English",
      durationHours: 300, durationLabel: "300–500 hours", weekly: "Self-paced",
      price: "free", certificate: "none", score: 4.7, popularity: 87, added: "2024-03-02",
      featured: false, url: "https://www.theodinproject.com/paths/foundations/courses/foundations",
      short: "A free, open-source curriculum that takes you from zero to a working full-stack foundation.",
      description: "The Odin Project's Foundations path is a project-driven introduction to web development. You will set up your development environment, learn HTML, CSS, and JavaScript, and build real pages as you go. The curriculum is open source, frequently updated, and designed to make you independent rather than dependent on tutorials.",
      skills: ["HTML", "CSS", "JavaScript", "Git", "Command line", "Problem solving"],
      syllabus: ["Introduction to the web", "Installations and developer tools", "Git basics", "HTML foundations", "CSS foundations", "Flexbox", "JavaScript basics", "JavaScript fundamentals", "DOM manipulation", "Project: landing page", "Project: rock paper scissors", "Project: etch-a-sketch"],
      requirements: "A computer with internet access. No coding experience required.",
      audience: "Self-directed beginners who prefer building and reading to passive video courses."
    },
    {
      id: "python-everybody",
      title: "Python for Everybody Specialization",
      provider: "coursera", institution: "University of Michigan", instructor: "Charles Severance",
      subject: "programming", level: "Beginner", language: "English",
      durationHours: 120, durationLabel: "8 months", weekly: "3 hrs/week",
      price: "audit", certificate: "paid", score: 4.8, popularity: 94, added: "2024-03-28",
      featured: false, url: "https://www.coursera.org/specializations/python",
      short: "The friendliest path into Python: data structures, web scraping, databases, and a capstone project.",
      description: "Python for Everybody is one of the most popular programming specializations in the world. It assumes no prior coding experience and builds up to practical skills: working with files, scraping the web, querying databases, and visualising data. The courses are available to audit for free.",
      skills: ["Python", "Data structures", "Web scraping", "SQL", "Data visualisation", "APIs"],
      syllabus: ["Programming for Everybody: getting started with Python", "Python data structures", "Using Python to access web data", "Using databases with Python", "Capstone: retrieving, processing, and visualising data"],
      requirements: "No programming experience. Basic computer literacy is enough.",
      audience: "Beginners who want a gentle, practical introduction to programming with Python."
    },
    {
      id: "microsoft-csharp",
      title: "Write Your First C# Code",
      provider: "microsoft", institution: "Microsoft Learn",
      subject: "programming", level: "Beginner", language: "English",
      durationHours: 5, durationLabel: "5 hours", weekly: "Self-paced",
      price: "free", certificate: "none", score: 4.6, popularity: 76, added: "2024-05-11",
      featured: false, url: "https://learn.microsoft.com/en-us/training/paths/get-started-c-sharp-part-1/",
      short: "A hands-on first step into C# and .NET, straight from Microsoft.",
      description: "This learning path introduces C# through short, interactive exercises in the browser. You will write your first lines of code, declare variables, work with strings and numbers, and use methods. It is a practical starting point for Windows apps, games with Unity, and backend development.",
      skills: ["C#", ".NET", "Variables", "Methods", "Console apps", "Debugging"],
      syllabus: ["Write your first C# code", "Store and retrieve data using literal and variable values", "Perform basic string formatting", "Perform basic operations on numbers", "Call methods", "Add decision logic", "Iterate through code blocks", "Build a small console project"],
      requirements: "A browser is enough; no prior programming experience needed.",
      audience: "Beginners curious about C#, .NET, Unity, or Windows development."
    },
    {
      id: "android-compose",
      title: "Android Basics with Compose",
      provider: "android", institution: "Android Developers",
      subject: "programming", level: "Beginner", language: "English",
      durationHours: 60, durationLabel: "Self-paced", weekly: "~10 hrs/week",
      price: "free", certificate: "none", score: 4.7, popularity: 82, added: "2024-06-08",
      featured: false, url: "https://developer.android.com/courses/android-basics-compose/course",
      short: "Build your first Android apps with Kotlin and Jetpack Compose, using Google's official course.",
      description: "Android Basics with Compose is Google's official path into Android development. You will learn Kotlin, build interfaces with Compose, handle user input, display lists, and connect to web APIs. The course is structured as units with codelabs and projects.",
      skills: ["Kotlin", "Jetpack Compose", "Android", "UI state", "Navigation", "APIs"],
      syllabus: ["Introduction to Kotlin", "Create your first Android app", "Build app UI with Compose", "Display lists and use Material Design", "Navigation and app architecture", "Connect to the internet", "Data persistence", "WorkManager and advanced topics"],
      requirements: "Some programming experience helps, but Kotlin is taught from the start. Android Studio and a computer are required.",
      audience: "Aspiring Android developers who want an official, project-based start."
    },
    {
      id: "codewithharry-python",
      title: "Python Tutorial for Beginners (Hindi)",
      provider: "codewithharry", institution: "CodeWithHarry",
      subject: "programming", level: "Beginner", language: "Hindi",
      durationHours: 30, durationLabel: "100 lessons", weekly: "Self-paced",
      price: "free", certificate: "none", score: 4.8, popularity: 92, added: "2024-08-20",
      featured: false, url: "https://www.youtube.com/playlist?list=PLu0W_9lII9agwh1XjRt242xIpHhPT2llg",
      short: "A complete, project-based Python course taught in Hindi — from your first line of code to OOP and real projects.",
      description: "CodeWithHarry's Hindi Python series is one of the most popular programming playlists in India. It moves step by step through Python syntax, loops, functions, object-oriented programming, file handling, and mini projects. The explanations are practical and designed for absolute beginners.",
      skills: ["Python", "Hindi", "OOP", "File handling", "Functions", "Projects"],
      syllabus: ["Introduction to programming and Python", "Modules, comments, and pip", "Variables and data types", "Strings and string methods", "Lists and tuples", "Dictionaries and sets", "Conditional expressions", "Loops and while loops", "Functions and recursion", "Object-oriented programming", "File I/O", "Mini projects"],
      requirements: "No prior programming experience. Hindi fluency helps.",
      audience: "Hindi-speaking beginners who want to learn Python in their own language."
    },
    {
      id: "nptel-c",
      title: "Introduction to Programming in C",
      provider: "nptel", institution: "IIT Kanpur",
      subject: "programming", level: "Beginner", language: "English",
      durationHours: 40, durationLabel: "12 weeks", weekly: "3–4 hrs/week",
      price: "free", certificate: "paid", score: 4.6, popularity: 80, added: "2024-09-12",
      featured: false, url: "https://nptel.ac.in/courses/106104128",
      short: "Learn to solve problems with C, from loops and functions to pointers and data structures.",
      description: "This NPTEL course from IIT Kanpur introduces programming through C. It emphasises problem solving rather than syntax alone: you will work with control flow, functions, arrays, pointers, strings, and basic data structures. Video lectures and assignments are free; an optional proctored exam leads to a certificate.",
      skills: ["C", "Problem solving", "Pointers", "Arrays", "Functions", "Data structures"],
      syllabus: ["Introduction to programming", "Variables, types, and expressions", "Conditionals and loops", "Functions and recursion", "Arrays and strings", "Pointers and memory", "Structures and unions", "File handling", "Basic data structures", "Problem-solving practice"],
      requirements: "Basic mathematics and comfort with a computer.",
      audience: "Engineering students and beginners in India who want a rigorous first programming course."
    },
    {
      id: "unity-essentials",
      title: "Unity Essentials",
      provider: "unity", institution: "Unity Learn",
      subject: "programming", level: "Beginner", language: "English",
      durationHours: 12, durationLabel: "Self-paced", weekly: "~12 hours",
      price: "free", certificate: "none", score: 4.5, popularity: 70, added: "2025-02-14",
      featured: false, url: "https://learn.unity.com/pathway/unity-essentials",
      short: "A guided first project in game development: the Unity editor, objects, physics, and your first playable scene.",
      description: "Unity Essentials is the official starting pathway for the Unity engine. In a few hours you will install Unity, learn the editor, place 3D objects, add physics, write simple C# scripts, and build a small scene. It is a friendly way to test whether game development is for you.",
      skills: ["Unity", "Game development", "C#", "3D", "Physics", "Level design"],
      syllabus: ["Install Unity and create a project", "Explore the editor", "Add and transform GameObjects", "Materials and lighting", "Physics and collisions", "Your first C# script", "Cameras and audio", "Build a tiny scene", "Publish your project"],
      requirements: "A computer that meets Unity's system requirements.",
      audience: "Curious beginners who want to try game development without committing to a long course."
    },

    /* ---------------- Data Science ---------------- */
    {
      id: "kaggle-intro-ml",
      title: "Intro to Machine Learning",
      provider: "kaggle", institution: "Kaggle",
      subject: "data-science", level: "Beginner", language: "English",
      durationHours: 3, durationLabel: "3 hours", weekly: "Self-paced",
      price: "free", certificate: "free", score: 4.7, popularity: 89, added: "2024-01-30",
      featured: false, url: "https://www.kaggle.com/learn/intro-to-machine-learning",
      short: "Build your first machine learning models in a few hours, with hands-on Kaggle notebooks.",
      description: "This short Kaggle course teaches the core ideas of machine learning by having you train real models. You will learn how decision trees and random forests work, how to validate models, and how to avoid overfitting. Everything runs in the browser with free notebooks.",
      skills: ["Machine learning", "Decision trees", "Random forests", "Model validation", "Python", "pandas"],
      syllabus: ["How models work", "Basic data exploration", "Your first machine learning model", "Model validation", "Underfitting and overfitting", "Random forests", "Machine learning competitions"],
      requirements: "Some Python experience helps; the course uses pandas and scikit-learn.",
      audience: "Beginners who want a quick, practical first taste of machine learning."
    },
    {
      id: "kaggle-pandas",
      title: "Pandas",
      provider: "kaggle", institution: "Kaggle",
      subject: "data-science", level: "Beginner", language: "English",
      durationHours: 4, durationLabel: "4 hours", weekly: "Self-paced",
      price: "free", certificate: "free", score: 4.8, popularity: 85, added: "2024-02-08",
      featured: false, url: "https://www.kaggle.com/learn/pandas",
      short: "Learn the data analysis library every Python data scientist uses, through short exercises.",
      description: "Pandas is the workhorse of data analysis in Python. This course covers DataFrames and Series, indexing, selecting, grouping, sorting, and combining data. Short lessons are followed by coding exercises in Kaggle notebooks, so you learn by doing.",
      skills: ["pandas", "DataFrames", "Data cleaning", "Grouping", "Data types", "Python"],
      syllabus: ["Creating, reading, and writing data", "Indexing, selecting, and assigning", "Summary functions and maps", "Grouping and sorting", "Data types and missing values", "Renaming and combining", "Final exercise"],
      requirements: "Basic Python syntax.",
      audience: "Python learners who want to work confidently with tabular data."
    },
    {
      id: "google-mlcc",
      title: "Machine Learning Crash Course",
      provider: "google", institution: "Google",
      subject: "data-science", level: "Beginner", language: "English",
      durationHours: 15, durationLabel: "15 hours", weekly: "Self-paced",
      price: "free", certificate: "none", score: 4.8, popularity: 94, added: "2024-03-10",
      featured: true, url: "https://developers.google.com/machine-learning/crash-course",
      short: "Google's fast, practical introduction to machine learning — with interactive visualisations and real datasets.",
      description: "Google's Machine Learning Crash Course is a hands-on introduction to ML concepts and TensorFlow. Lessons cover loss and gradient descent, overfitting, feature engineering, classification, neural networks, and fairness. Interactive exercises and case studies make the ideas stick.",
      skills: ["Machine learning", "TensorFlow", "Regression", "Classification", "Neural networks", "Feature engineering"],
      syllabus: ["Framing ML problems", "Descending into ML", "Reducing loss", "Overfitting and regularization", "Feature sets", "Logistic regression", "Classification", "Regularization for simplicity", "Neural networks", "Embeddings", "Fairness in ML"],
      requirements: "Basic algebra and some Python or programming experience.",
      audience: "Developers and analysts who want a practical, no-cost foundation in machine learning."
    },
    {
      id: "hf-nlp",
      title: "Natural Language Processing Course",
      provider: "huggingface", institution: "Hugging Face",
      subject: "data-science", level: "Intermediate", language: "English",
      durationHours: 25, durationLabel: "20–30 hours", weekly: "Self-paced",
      price: "free", certificate: "none", score: 4.8, popularity: 87, added: "2024-05-19",
      featured: false, url: "https://huggingface.co/learn/nlp-course",
      short: "Learn how modern language models work and fine-tune them with the Hugging Face ecosystem.",
      description: "This free course teaches natural language processing with Transformers, the architecture behind modern AI assistants. You will use pipelines, datasets, and tokenizers, fine-tune pretrained models, and share your results. It is practical, code-first, and updated as the ecosystem changes.",
      skills: ["NLP", "Transformers", "PyTorch", "Tokenizers", "Fine-tuning", "Hugging Face"],
      syllabus: ["Transformer models", "Using Transformers", "Fine-tuning a pretrained model", "Sharing models and tokenizers", "The Datasets library", "The Tokenizers library", "Main NLP tasks", "How to ask for help", "Building a demo", "Final project"],
      requirements: "Python and basic deep learning familiarity. A Google account or Hugging Face account helps.",
      audience: "Developers moving into NLP and generative AI who want practical Transformer experience."
    },
    {
      id: "fastai",
      title: "Practical Deep Learning for Coders",
      provider: "fastai", institution: "fast.ai", instructor: "Jeremy Howard",
      subject: "data-science", level: "Intermediate", language: "English",
      durationHours: 60, durationLabel: "8 weeks", weekly: "4–6 hrs/week",
      price: "free", certificate: "none", score: 4.8, popularity: 90, added: "2024-06-15",
      featured: false, url: "https://course.fast.ai/",
      short: "Go from knowing Python to training state-of-the-art models, with a top-down, practical approach.",
      description: "fast.ai's flagship course teaches deep learning by getting you to train models immediately, then explaining what happened. You will work on computer vision, NLP, tabular data, and collaborative filtering, and learn to deploy models. It is free, fast-paced, and built for working programmers.",
      skills: ["Deep learning", "PyTorch", "Computer vision", "NLP", "Model deployment", "Python"],
      syllabus: ["Getting started with deep learning", "Production and deployment", "Neural net foundations", "Natural language processing", "From-scratch model", "Random forests", "Collaborative filtering", "Convolutions", "Data ethics", "ResNets and advanced training"],
      requirements: "At least one year of Python experience and basic high-school maths.",
      audience: "Programmers who want to build real deep learning applications rather than study theory first."
    },
    {
      id: "stanford-cs229",
      title: "CS229: Machine Learning",
      provider: "stanford", institution: "Stanford University", instructor: "Andrew Ng",
      subject: "data-science", level: "Advanced", language: "English",
      durationHours: 60, durationLabel: "Full course", weekly: "12–15 hrs/week",
      price: "free", certificate: "none", score: 4.9, popularity: 86, added: "2025-01-08",
      featured: false, url: "https://cs229.stanford.edu/",
      short: "Stanford's rigorous machine learning course, with lecture notes and videos available to the public.",
      description: "CS229 is Stanford's flagship machine learning course. It covers supervised learning, generative models, support vector machines, learning theory, and reinforcement learning with a strong mathematical foundation. Public lecture notes and videos make the full course accessible, though it is considerably more theoretical than introductory ML courses.",
      skills: ["Machine learning", "Statistics", "Optimisation", "Neural networks", "Reinforcement learning", "Mathematics"],
      syllabus: ["Supervised learning and linear regression", "Logistic regression and generalised linear models", "Generative learning algorithms", "Support vector machines", "Kernels and margin classifiers", "Learning theory", "Regularisation and model selection", "Unsupervised learning", "Reinforcement learning", "Deep learning"],
      requirements: "Linear algebra, multivariable calculus, probability, and programming maturity.",
      audience: "Advanced students and engineers who want a mathematical grounding in machine learning."
    },

    /* ---------------- Mathematics ---------------- */
    {
      id: "mit-1806",
      title: "Linear Algebra",
      provider: "mit", institution: "MIT OpenCourseWare", instructor: "Gilbert Strang",
      subject: "mathematics", level: "Beginner", language: "English",
      durationHours: 35, durationLabel: "35 lectures", weekly: "Self-paced",
      price: "free", certificate: "none", score: 4.9, popularity: 91, added: "2024-01-18",
      featured: true, url: "https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/",
      short: "Gilbert Strang's celebrated course — matrices, vector spaces, eigenvalues, and the ideas behind modern data.",
      description: "MIT 18.06 is one of the clearest introductions to linear algebra ever recorded. Gilbert Strang connects equations, matrices, geometry, and applications, with a warmth and enthusiasm that makes abstract ideas concrete. It is essential groundwork for machine learning, graphics, physics, and engineering.",
      skills: ["Linear algebra", "Matrices", "Eigenvalues", "Vector spaces", "Least squares", "Applications"],
      syllabus: ["The geometry of linear equations", "Elimination with matrices", "Multiplication and inverse matrices", "Factorisation into A = LU", "Transposes, permutations, and spaces", "Column space and nullspace", "Solving Ax = 0 and Ax = b", "Independence, basis, and dimension", "Orthogonal projections and least squares", "Determinants", "Eigenvalues and eigenvectors", "Symmetric matrices and positive definiteness", "Singular value decomposition"],
      requirements: "High-school algebra. Calculus is helpful but not required for most lectures.",
      audience: "Anyone who wants a deep, intuitive foundation in linear algebra."
    },
    {
      id: "khan-calculus",
      title: "Calculus 1",
      provider: "khan", institution: "Khan Academy",
      subject: "mathematics", level: "Beginner", language: "English",
      durationHours: 40, durationLabel: "Self-paced", weekly: "Flexible",
      price: "free", certificate: "none", score: 4.8, popularity: 90, added: "2024-02-20",
      featured: false, url: "https://www.khanacademy.org/math/calculus-1",
      short: "A friendly, practice-rich introduction to limits, derivatives, and integrals.",
      description: "Khan Academy's Calculus 1 course breaks calculus into short videos and interactive exercises. You will build intuition for limits, learn derivative rules, apply differentiation to real problems, and begin integration. Mastery tracking shows exactly which skills need more practice.",
      skills: ["Limits", "Derivatives", "Differentiation", "Integrals", "Problem solving"],
      syllabus: ["Limits and continuity", "Derivatives: definition and basic rules", "Derivatives: chain rule and other advanced topics", "Applications of derivatives", "Analysing functions", "Integrals", "Differential equations", "Applications of integrals"],
      requirements: "Algebra, functions, and trigonometry.",
      audience: "Students preparing for calculus or filling gaps before university maths."
    },
    {
      id: "khan-stats",
      title: "Statistics and Probability",
      provider: "khan", institution: "Khan Academy",
      subject: "mathematics", level: "Beginner", language: "English",
      durationHours: 30, durationLabel: "Self-paced", weekly: "Flexible",
      price: "free", certificate: "none", score: 4.8, popularity: 89, added: "2024-03-04",
      featured: false, url: "https://www.khanacademy.org/math/statistics-probability",
      short: "Understand data and uncertainty with videos, practice, and real examples.",
      description: "This course covers the statistics and probability needed to read research, interpret data, and start data science. You will explore distributions, sampling, confidence intervals, hypothesis testing, and regression through interactive exercises.",
      skills: ["Probability", "Statistics", "Distributions", "Hypothesis testing", "Regression", "Data literacy"],
      syllabus: ["Analysing categorical data", "Displaying and comparing quantitative data", "Summarising quantitative data", "Probability", "Random variables", "Sampling distributions", "Confidence intervals", "Significance tests", "Inference for categorical data", "Regression"],
      requirements: "Basic algebra.",
      audience: "Students, researchers, and anyone who wants to make sense of data."
    },
    {
      id: "mit-1801",
      title: "Single Variable Calculus",
      provider: "mit", institution: "MIT OpenCourseWare",
      subject: "mathematics", level: "Beginner", language: "English",
      durationHours: 45, durationLabel: "35 lectures", weekly: "Self-paced",
      price: "free", certificate: "none", score: 4.8, popularity: 86, added: "2024-04-22",
      featured: false, url: "https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/",
      short: "A complete MIT calculus course with lectures, recitations, problem sets, and exams.",
      description: "MIT 18.01 covers differentiation and integration of functions of one variable, with applications to geometry, rates, and approximation. The OpenCourseWare edition includes full video lectures, recitations, problem sets with solutions, and exams. It is a thorough alternative to a textbook.",
      skills: ["Calculus", "Differentiation", "Integration", "Limits", "Series", "Applications"],
      syllabus: ["Derivatives and rates of change", "Limits and continuity", "Differentiation rules", "Applications of differentiation", "Integration", "Techniques of integration", "Applications of integration", "Taylor series", "Differential equations", "Final review"],
      requirements: "Precalculus, algebra, and trigonometry.",
      audience: "Students who want a complete, rigorous first calculus course at their own pace."
    },
    {
      id: "coursera-mml",
      title: "Mathematics for Machine Learning",
      provider: "coursera", institution: "Imperial College London",
      subject: "mathematics", level: "Intermediate", language: "English",
      durationHours: 60, durationLabel: "3 months", weekly: "4 hrs/week",
      price: "audit", certificate: "paid", score: 4.7, popularity: 84, added: "2024-06-01",
      featured: false, url: "https://www.coursera.org/specializations/mathematics-machine-learning",
      short: "Build the linear algebra and calculus foundations behind machine learning.",
      description: "This specialization connects university mathematics to machine learning practice. You will learn linear algebra, multivariate calculus, principal component analysis, and support vector machines, with Python labs that turn each concept into working code.",
      skills: ["Linear algebra", "Multivariable calculus", "PCA", "SVM", "Python", "Machine learning"],
      syllabus: ["Linear algebra", "Multivariate calculus", "Principal component analysis", "Support vector machines", "Python labs and projects"],
      requirements: "High-school maths and basic Python.",
      audience: "Aspiring ML practitioners who want to understand the maths rather than treat models as a black box."
    },
    {
      id: "khan-hindi-class10",
      title: "Class 10 Maths (India) — Hindi",
      provider: "khan", institution: "Khan Academy India",
      subject: "mathematics", level: "Beginner", language: "Hindi",
      durationHours: 40, durationLabel: "Full CBSE course", weekly: "Flexible",
      price: "free", certificate: "none", score: 4.7, popularity: 91, added: "2024-09-18",
      featured: false, url: "https://www.khanacademy.org/math/in-in-class-10-math-cbse-hindi",
      short: "Complete Class 10 CBSE maths in Hindi, with videos, practice, and unit tests.",
      description: "This Khan Academy course covers the full Class 10 CBSE maths syllabus in Hindi. Each unit pairs short explanations with practice and unit tests, making it useful for board exam revision or building concepts from scratch. It is completely free and works on low-bandwidth connections.",
      skills: ["Class 10 maths", "Hindi", "Algebra", "Geometry", "Trigonometry", "Statistics"],
      syllabus: ["Real numbers", "Polynomials", "Pair of linear equations", "Quadratic equations", "Arithmetic progressions", "Triangles", "Coordinate geometry", "Introduction to trigonometry", "Circles", "Surface areas and volumes", "Statistics", "Probability"],
      requirements: "Class 9 maths.",
      audience: "Hindi-medium Class 10 students preparing for CBSE board exams."
    },

    /* ---------------- Science ---------------- */
    {
      id: "mit-801",
      title: "Classical Mechanics",
      provider: "mit", institution: "MIT OpenCourseWare",
      subject: "science", level: "Beginner", language: "English",
      durationHours: 40, durationLabel: "24 lectures", weekly: "Self-paced",
      price: "free", certificate: "none", score: 4.9, popularity: 90, added: "2024-01-22",
      featured: false, url: "https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/",
      short: "MIT's physics foundation: motion, forces, energy, momentum, and the mechanics of the everyday world.",
      description: "8.01 is MIT's introductory mechanics course, and this OpenCourseWare edition includes everything: lectures, problem-solving videos, simulations, problem sets, and exams. It builds a strong conceptual and mathematical foundation for physics and engineering.",
      skills: ["Mechanics", "Newton's laws", "Energy", "Momentum", "Rotational motion", "Problem solving"],
      syllabus: ["Kinematics", "Newton's laws", "Circular motion", "Work and energy", "Momentum and collisions", "Rotational motion", "Angular momentum", "Gravitation", "Simple harmonic motion", "Fluid mechanics"],
      requirements: "Calculus helps; algebra and trigonometry are essential.",
      audience: "Students starting physics or engineering who want a complete first mechanics course."
    },
    {
      id: "khan-physics",
      title: "Physics",
      provider: "khan", institution: "Khan Academy",
      subject: "science", level: "Beginner", language: "English",
      durationHours: 35, durationLabel: "Self-paced", weekly: "Flexible",
      price: "free", certificate: "none", score: 4.8, popularity: 91, added: "2024-02-26",
      featured: false, url: "https://www.khanacademy.org/science/physics",
      short: "From motion and forces to circuits and waves, with practice after every idea.",
      description: "Khan Academy Physics covers the core topics of introductory physics with short videos and mastery-based exercises. You can move through mechanics, energy, waves, electricity, and magnetism at your own pace, using hints and worked examples when stuck.",
      skills: ["Physics", "Mechanics", "Energy", "Waves", "Electricity", "Magnetism"],
      syllabus: ["One-dimensional motion", "Forces and Newton's laws", "Work and energy", "Impulse and momentum", "Rotational motion", "Gravitation", "Waves and sound", "Electric charge and fields", "Circuits", "Magnetism", "Electromagnetic waves"],
      requirements: "Basic algebra and trigonometry.",
      audience: "School and university students who want clear explanations and lots of practice."
    },
    {
      id: "khan-biology",
      title: "Biology",
      provider: "khan", institution: "Khan Academy",
      subject: "science", level: "Beginner", language: "English",
      durationHours: 30, durationLabel: "Self-paced", weekly: "Flexible",
      price: "free", certificate: "none", score: 4.8, popularity: 89, added: "2024-03-16",
      featured: false, url: "https://www.khanacademy.org/science/biology",
      short: "Cells, genetics, evolution, and ecology explained clearly, with practice built in.",
      description: "This biology course surveys life from molecules to ecosystems. It covers cell structure, energy, genetics, evolution, and ecology with videos, articles, and questions. It is useful for school exams, AP Biology, or general scientific literacy.",
      skills: ["Biology", "Cells", "Genetics", "Evolution", "Ecology", "Scientific reasoning"],
      syllabus: ["Intro to biology", "Chemistry of life", "Water, acids, and bases", "Macromolecules", "Energy and enzymes", "Cell structure", "Cellular respiration", "Photosynthesis", "Cell division", "Classical and molecular genetics", "Evolution and natural selection", "Ecology"],
      requirements: "No prior biology required.",
      audience: "Students and curious learners who want a thorough, free biology overview."
    },
    {
      id: "mit-5111",
      title: "Principles of Chemical Science",
      provider: "mit", institution: "MIT OpenCourseWare",
      subject: "science", level: "Beginner", language: "English",
      durationHours: 35, durationLabel: "26 lectures", weekly: "Self-paced",
      price: "free", certificate: "none", score: 4.8, popularity: 82, added: "2024-05-06",
      featured: false, url: "https://ocw.mit.edu/courses/5-111sc-principles-of-chemical-science-fall-2014/",
      short: "MIT's introduction to chemistry: atomic structure, bonding, thermodynamics, and equilibrium.",
      description: "5.111 introduces chemical principles with an emphasis on why atoms behave the way they do. Topics include atomic structure, molecular orbitals, acid-base chemistry, thermodynamics, and kinetics. Full lectures, notes, and problem sets are available.",
      skills: ["Chemistry", "Atomic structure", "Bonding", "Thermodynamics", "Equilibrium", "Kinetics"],
      syllabus: ["Atomic structure and periodic trends", "Lewis structures and VSEPR", "Molecular orbital theory", "Valence bond theory", "Acid-base chemistry", "Thermodynamics", "Chemical equilibrium", "Electrochemistry", "Kinetics", "Coordination chemistry"],
      requirements: "High-school chemistry and algebra.",
      audience: "Students preparing for university chemistry or refreshing their foundations."
    },
    {
      id: "astronomy-coursera",
      title: "Astronomy: Exploring Time and Space",
      provider: "coursera", institution: "University of Arizona", instructor: "Chris Impey",
      subject: "science", level: "Beginner", language: "English",
      durationHours: 30, durationLabel: "6 weeks", weekly: "4–6 hrs/week",
      price: "audit", certificate: "paid", score: 4.7, popularity: 81, added: "2024-07-19",
      featured: false, url: "https://www.coursera.org/learn/astronomy",
      short: "A tour of the universe: planets, stars, galaxies, black holes, and the search for life.",
      description: "This course introduces modern astronomy for a general audience. You will learn how telescopes work, how stars are born and die, what galaxies and black holes are, and how scientists search for planets and life beyond Earth. No advanced maths is required.",
      skills: ["Astronomy", "Solar system", "Stars", "Galaxies", "Cosmology", "Astrobiology"],
      syllabus: ["The night sky", "The solar system", "Stars and stellar evolution", "Galaxies", "Black holes", "Cosmology", "Exoplanets", "The search for life"],
      requirements: "Curiosity and basic high-school science.",
      audience: "Anyone who wants a guided, scientifically grounded tour of the cosmos."
    },

    /* ---------------- Business ---------------- */
    {
      id: "yale-financial-markets",
      title: "Financial Markets",
      provider: "yale", institution: "Yale University", instructor: "Robert Shiller",
      subject: "business", level: "Beginner", language: "English",
      durationHours: 23, durationLabel: "23 lectures", weekly: "Self-paced",
      price: "free", certificate: "none", score: 4.8, popularity: 90, added: "2024-01-28",
      featured: true, url: "https://oyc.yale.edu/economics/econ-252-11",
      short: "Robert Shiller's Nobel-winning perspective on markets, risk, banking, and behavioural finance.",
      description: "In this Yale course, Nobel laureate Robert Shiller explains how financial markets work and why they sometimes fail. Lectures cover risk, insurance, banking, stocks, bonds, real estate, and behavioural finance, with an emphasis on the institutions that shape everyday life.",
      skills: ["Finance", "Investing", "Risk", "Banking", "Behavioural finance", "Markets"],
      syllabus: ["Introduction to financial markets", "Risk and financial institutions", "Insurance and risk management", "Stocks and bonds", "Real estate and mortgages", "Banking and central banks", "Behavioural finance", "Financial crises", "Regulation and ethics", "Course review"],
      requirements: "No finance background required.",
      audience: "Anyone who wants to understand markets without hype or jargon."
    },
    {
      id: "hubspot-inbound",
      title: "Inbound Marketing Certification",
      provider: "hubspot", institution: "HubSpot Academy",
      subject: "business", level: "Beginner", language: "English",
      durationHours: 6, durationLabel: "6 hours", weekly: "Self-paced",
      price: "free", certificate: "free", score: 4.6, popularity: 77, added: "2024-02-12",
      featured: false, url: "https://academy.hubspot.com/courses/inbound-marketing",
      short: "Learn the inbound approach to attracting customers with content, SEO, social, and email.",
      description: "HubSpot's Inbound Marketing certification explains how to attract, engage, and delight customers without interrupting them. You will learn buyer personas, content strategy, SEO, social media, email, and landing pages, then take a free exam for a certificate.",
      skills: ["Marketing", "Content strategy", "SEO", "Social media", "Email marketing", "Analytics"],
      syllabus: ["Inbound marketing fundamentals", "Buyer personas", "Content creation", "SEO and search", "Social media", "Email marketing", "Landing pages and CTAs", "Lead nurturing", "Analytics and optimisation", "Certification exam"],
      requirements: "No marketing experience needed.",
      audience: "Small business owners, marketers, and students building practical digital marketing skills."
    },
    {
      id: "mit-new-enterprises",
      title: "New Enterprises",
      provider: "mit", institution: "MIT OpenCourseWare",
      subject: "business", level: "Intermediate", language: "English",
      durationHours: 30, durationLabel: "24 sessions", weekly: "Self-paced",
      price: "free", certificate: "none", score: 4.7, popularity: 78, added: "2024-04-14",
      featured: false, url: "https://ocw.mit.edu/courses/15-390-new-enterprises-spring-2013/",
      short: "Turn an idea into a venture: customer discovery, business models, funding, and pitching.",
      description: "MIT's New Enterprises course follows the process of starting a company from first idea to investor pitch. Students work in teams to validate problems, design business models, understand finance, and present their ventures. Lectures and case materials are available free.",
      skills: ["Entrepreneurship", "Business models", "Customer discovery", "Fundraising", "Pitching", "Strategy"],
      syllabus: ["Idea generation and opportunity", "Customer discovery", "Value proposition", "Business models", "Market sizing", "Competitive analysis", "Financial projections", "Funding options", "Legal and team issues", "Final pitch"],
      requirements: "No prerequisites; an idea or team helps.",
      audience: "Aspiring founders and students who want a structured approach to launching a venture."
    },
    {
      id: "yale-game-theory",
      title: "Game Theory",
      provider: "yale", institution: "Yale University", instructor: "Ben Polak",
      subject: "business", level: "Intermediate", language: "English",
      durationHours: 24, durationLabel: "24 lectures", weekly: "Self-paced",
      price: "free", certificate: "none", score: 4.8, popularity: 84, added: "2024-05-22",
      featured: false, url: "https://oyc.yale.edu/economics/econ-159",
      short: "Learn to analyse strategic situations — from auctions and negotiations to arms races and evolution.",
      description: "Yale's Game Theory course teaches the tools economists use to reason about strategic interaction. Through games, examples, and formal analysis, you will learn Nash equilibrium, mixed strategies, backward induction, and repeated games, and apply them to business, politics, and everyday decisions.",
      skills: ["Game theory", "Strategy", "Nash equilibrium", "Negotiation", "Economics", "Critical thinking"],
      syllabus: ["Introduction to game theory", "Nash equilibrium", "Mixed strategies", "Sequential games", "Backward induction", "Repeated games", "Cooperation and punishment", "Evolutionary game theory", "Auctions", "Applications and review"],
      requirements: "Basic algebra and comfort with abstract reasoning.",
      audience: "Students and professionals who want a rigorous toolkit for strategic decisions."
    },
    {
      id: "coursera-negotiation",
      title: "Successful Negotiation: Essential Strategies and Skills",
      provider: "coursera", institution: "University of Michigan", instructor: "George Siedel",
      subject: "business", level: "Beginner", language: "English",
      durationHours: 20, durationLabel: "4 weeks", weekly: "4 hrs/week",
      price: "audit", certificate: "paid", score: 4.8, popularity: 88, added: "2024-07-02",
      featured: false, url: "https://www.coursera.org/learn/negotiation",
      short: "A practical, evidence-based guide to negotiating better deals at work and in life.",
      description: "This course teaches negotiation as a learnable skill. You will prepare for negotiations, understand the other side, create value, handle difficult tactics, and close agreements. Real examples and exercises make it immediately useful for salary talks, contracts, and everyday decisions.",
      skills: ["Negotiation", "Communication", "Persuasion", "Conflict resolution", "Decision making", "Contracts"],
      syllabus: ["Understanding negotiation", "Preparation and planning", "Creating value", "Distributive bargaining", "Integrative negotiation", "Difficult tactics", "Contracts and ethics", "Final negotiation project"],
      requirements: "No prior business study required.",
      audience: "Anyone who negotiates — job seekers, managers, freelancers, and founders."
    },

    /* ---------------- Design ---------------- */
    {
      id: "figma-learn",
      title: "Learn Design with Figma",
      provider: "figma", institution: "Figma",
      subject: "design", level: "Beginner", language: "English",
      durationHours: 8, durationLabel: "Self-paced", weekly: "Flexible",
      price: "free", certificate: "none", score: 4.6, popularity: 80, added: "2024-02-18",
      featured: false, url: "https://help.figma.com/hc/en-us/categories/360002051613-Learn-Figma",
      short: "Get started with Figma and the fundamentals of interface design, straight from the source.",
      description: "Figma's official learning resources walk you through the tool and the design process. You will learn frames, components, auto layout, prototyping, and collaboration, with guided projects. It is a practical first step for UI and product design.",
      skills: ["Figma", "UI design", "Prototyping", "Components", "Auto layout", "Collaboration"],
      syllabus: ["Figma basics", "Frames and layouts", "Components and styles", "Auto layout", "Prototyping", "Collaboration and handoff", "Design systems", "Practice project"],
      requirements: "A free Figma account and a browser.",
      audience: "Beginners exploring UI/UX and product design."
    },
    {
      id: "canva-designschool",
      title: "Canva Design School",
      provider: "canva", institution: "Canva",
      subject: "design", level: "Beginner", language: "English",
      durationHours: 6, durationLabel: "Self-paced", weekly: "Flexible",
      price: "free", certificate: "none", score: 4.5, popularity: 76, added: "2024-03-22",
      featured: false, url: "https://www.canva.com/designschool/",
      short: "Learn practical graphic design — layout, colour, typography, and branding — by making things.",
      description: "Canva Design School offers short courses and tutorials on visual communication. You will learn the principles behind good layouts, colour palettes, typography, and brand identity, then apply them in Canva projects. It is ideal for non-designers who need to create polished visuals.",
      skills: ["Graphic design", "Layout", "Typography", "Colour", "Branding", "Canva"],
      syllabus: ["Design fundamentals", "Layout and composition", "Colour theory", "Typography basics", "Brand identity", "Social media design", "Presentation design", "Portfolio project"],
      requirements: "A free Canva account.",
      audience: "Students, small business owners, and anyone who wants to make better-looking visuals."
    },
    {
      id: "coursera-ux",
      title: "Introduction to User Experience Design",
      provider: "coursera", institution: "Georgia Institute of Technology",
      subject: "design", level: "Beginner", language: "English",
      durationHours: 12, durationLabel: "4 weeks", weekly: "3 hrs/week",
      price: "audit", certificate: "paid", score: 4.6, popularity: 83, added: "2024-04-30",
      featured: false, url: "https://www.coursera.org/learn/user-experience-design",
      short: "Understand users, define problems, and design interfaces people can actually use.",
      description: "This course introduces the UX design process from Georgia Tech. You will learn how to gather requirements, model users, design interactions, and evaluate prototypes. It is a concise, academic introduction for people considering UX as a career.",
      skills: ["UX design", "User research", "Interaction design", "Prototyping", "Usability", "Design process"],
      syllabus: ["What is user experience?", "Understanding users", "Task analysis", "Designing interactions", "Prototyping", "Evaluating designs", "Design ethics", "Final project"],
      requirements: "No design experience required.",
      audience: "Beginners curious about UX and product design as a career."
    },
    {
      id: "coursera-webdesign",
      title: "Web Design for Everybody",
      provider: "coursera", institution: "University of Michigan", instructor: "Colleen van Lent, Charles Severance",
      subject: "design", level: "Beginner", language: "English",
      durationHours: 100, durationLabel: "5 months", weekly: "3 hrs/week",
      price: "audit", certificate: "paid", score: 4.8, popularity: 86, added: "2024-06-12",
      featured: false, url: "https://www.coursera.org/specializations/web-design",
      short: "A complete beginner path to building accessible, responsive websites with HTML, CSS, and JavaScript.",
      description: "Web Design for Everybody teaches the technical and design foundations of the web. You will learn HTML5, CSS3, JavaScript, responsive design, and accessibility, then build a portfolio site. The specialization is designed for learners with no prior coding experience.",
      skills: ["HTML", "CSS", "JavaScript", "Responsive design", "Accessibility", "Portfolio"],
      syllabus: ["Introduction to HTML5", "Introduction to CSS3", "Interactivity with JavaScript", "Advanced styling with responsive design", "Web design capstone"],
      requirements: "No prior experience. A computer with a browser and code editor.",
      audience: "Beginners who want a structured, university-taught path to front-end web design."
    },
    {
      id: "coursera-photography",
      title: "Photography Basics and Beyond",
      provider: "coursera", institution: "Michigan State University",
      subject: "design", level: "Beginner", language: "English",
      durationHours: 60, durationLabel: "5 months", weekly: "3 hrs/week",
      price: "audit", certificate: "paid", score: 4.7, popularity: 78, added: "2024-08-02",
      featured: false, url: "https://www.coursera.org/specializations/photography",
      short: "From smartphone snapshots to deliberate photographs: light, composition, editing, and storytelling.",
      description: "This specialization teaches photography as a craft and a way of seeing. You will learn how cameras work, how to use light and composition, how to edit images, and how to build a coherent body of work. Assignments encourage you to shoot regularly and critique your own photos.",
      skills: ["Photography", "Composition", "Lighting", "Editing", "Visual storytelling", "Critique"],
      syllabus: ["Camera basics", "Exposure and light", "Composition", "Seeing like a photographer", "Editing and post-processing", "Genres of photography", "Building a portfolio", "Final project"],
      requirements: "A camera — a smartphone is enough to start.",
      audience: "Beginners who want to take better photographs with any camera."
    },

    /* ---------------- Health & Psychology ---------------- */
    {
      id: "yale-psych",
      title: "Introduction to Psychology",
      provider: "yale", institution: "Yale University", instructor: "Paul Bloom",
      subject: "health", level: "Beginner", language: "English",
      durationHours: 20, durationLabel: "20 lectures", weekly: "Self-paced",
      price: "free", certificate: "none", score: 4.8, popularity: 91, added: "2024-01-16",
      featured: false, url: "https://oyc.yale.edu/psychology/psyc-110",
      short: "A lively tour of the mind: perception, memory, emotion, development, personality, and mental health.",
      description: "Paul Bloom's Introduction to Psychology covers the big questions of human behaviour. Lectures explore perception, learning, memory, language, intelligence, emotion, development, personality, and disorders, with experiments and real cases. It is an accessible first course for anyone curious about the mind.",
      skills: ["Psychology", "Memory", "Emotion", "Development", "Personality", "Critical thinking"],
      syllabus: ["Introduction to psychology", "The brain and behaviour", "Perception", "Learning", "Memory", "Language", "Intelligence", "Emotion", "Development", "Personality", "Mental health", "Social psychology"],
      requirements: "No prior psychology study required.",
      audience: "Anyone interested in understanding themselves and other people better."
    },
    {
      id: "coursera-wellbeing",
      title: "The Science of Well-Being",
      provider: "coursera", institution: "Yale University", instructor: "Laurie Santos",
      subject: "health", level: "Beginner", language: "English",
      durationHours: 19, durationLabel: "6 weeks", weekly: "3 hrs/week",
      price: "audit", certificate: "paid", score: 4.9, popularity: 97, added: "2024-02-02",
      featured: true, url: "https://www.coursera.org/learn/the-science-of-well-being",
      short: "What psychological science says actually makes us happier — and practical exercises to build those habits.",
      description: "Yale's most popular course in its history, The Science of Well-Being, separates evidence from self-help myths. You will learn what predicts happiness, why our minds mispredict it, and which practices — gratitude, savouring, kindness, exercise — have real support. Weekly activities help you apply the science.",
      skills: ["Well-being", "Happiness", "Habits", "Gratitude", "Mindfulness", "Behaviour change"],
      syllabus: ["Misconceptions about happiness", "Why our expectations are so bad", "What do we really want?", "How can we overcome our biases?", "What puts us in a good mood?", "How to make lasting changes"],
      requirements: "No background required.",
      audience: "Anyone who wants evidence-based ways to feel better and build healthier habits."
    },
    {
      id: "khan-health",
      title: "Health and Medicine",
      provider: "khan", institution: "Khan Academy",
      subject: "health", level: "Beginner", language: "English",
      durationHours: 25, durationLabel: "Self-paced", weekly: "Flexible",
      price: "free", certificate: "none", score: 4.6, popularity: 78, added: "2024-03-30",
      featured: false, url: "https://www.khanacademy.org/science/health-and-medicine",
      short: "Understand the human body, disease, and healthcare with clear explanations.",
      description: "Khan Academy's health and medicine library covers anatomy, physiology, infectious disease, the immune system, and public health. It is written for learners rather than clinicians, with diagrams and explanations that make medical ideas accessible.",
      skills: ["Human biology", "Anatomy", "Disease", "Immunology", "Public health", "Health literacy"],
      syllabus: ["Introduction to the human body", "Circulatory system", "Respiratory system", "Nervous system", "Endocrine system", "Immune system", "Infectious disease", "Public health", "Health systems"],
      requirements: "Basic biology helps.",
      audience: "Students considering healthcare careers and anyone who wants better health literacy."
    },
    {
      id: "coursera-exercise",
      title: "Science of Exercise",
      provider: "coursera", institution: "University of Colorado Boulder",
      subject: "health", level: "Beginner", language: "English",
      durationHours: 12, durationLabel: "4 weeks", weekly: "3 hrs/week",
      price: "audit", certificate: "paid", score: 4.7, popularity: 80, added: "2024-05-28",
      featured: false, url: "https://www.coursera.org/learn/science-exercise",
      short: "What actually happens in your body when you exercise — and how to train smarter.",
      description: "This course explains the physiology of exercise in practical terms. You will learn how muscles use energy, how the cardiovascular system adapts, how to design training programmes, and what the evidence says about recovery and performance. Useful for coaches and everyday athletes.",
      skills: ["Exercise science", "Physiology", "Training", "Nutrition", "Recovery", "Health"],
      syllabus: ["Exercise and the human body", "Energy systems", "Muscle physiology", "Cardiovascular adaptations", "Training principles", "Nutrition and hydration", "Recovery and injury prevention", "Designing a programme"],
      requirements: "Basic biology is helpful but not required.",
      audience: "Fitness enthusiasts, coaches, and anyone who wants evidence-based training knowledge."
    },
    {
      id: "coursera-pfa",
      title: "Psychological First Aid",
      provider: "coursera", institution: "Johns Hopkins University",
      subject: "health", level: "Beginner", language: "English",
      durationHours: 10, durationLabel: "4 weeks", weekly: "2–3 hrs/week",
      price: "audit", certificate: "paid", score: 4.8, popularity: 84, added: "2024-09-25",
      featured: false, url: "https://www.coursera.org/learn/psychological-first-aid",
      short: "Learn how to support someone in distress with a practical, evidence-based action framework.",
      description: "Psychological First Aid teaches a humane, structured way to help people during and after crises. You will learn how to listen, assess needs, provide comfort, connect people to support, and take care of yourself as a helper. The course is designed for laypeople and frontline workers.",
      skills: ["Psychological first aid", "Listening", "Crisis support", "Empathy", "Self-care", "Referral"],
      syllabus: ["What is psychological first aid?", "Looking, listening, and linking", "Assessing needs", "Providing practical support", "Supporting children and families", "Referral and boundaries", "Helper self-care", "Final scenario"],
      requirements: "No clinical background required.",
      audience: "Teachers, volunteers, managers, and anyone who may support someone in crisis."
    },

    /* ---------------- Languages ---------------- */
    {
      id: "duolingo-spanish",
      title: "Learn Spanish",
      provider: "duolingo", institution: "Duolingo", target: "Spanish",
      subject: "languages", level: "Beginner", language: "English",
      durationHours: 30, durationLabel: "Self-paced · daily practice", weekly: "10–20 min/day",
      price: "free", certificate: "none", score: 4.6, popularity: 89, added: "2024-01-10",
      featured: false, url: "https://www.duolingo.com/course/es/en/Learn-Spanish",
      short: "Build Spanish vocabulary and grammar with short, game-like daily lessons.",
      description: "Duolingo's Spanish course turns practice into a daily habit. Bite-sized lessons cover vocabulary, grammar, listening, and speaking, with spaced repetition and streaks to keep you coming back. The core course is free, and it works well as a supplement to a structured class.",
      skills: ["Spanish", "Vocabulary", "Grammar", "Listening", "Speaking", "Daily practice"],
      syllabus: ["Greetings and introductions", "Everyday objects and people", "Food and drink", "Travel and directions", "Present tense", "Past tense", "Future plans", "Conversation practice"],
      requirements: "No prior Spanish. Works on web and mobile.",
      audience: "Beginners who want a low-pressure way to start speaking Spanish every day."
    },
    {
      id: "bbc-learning",
      title: "BBC Learning English",
      provider: "bbc", institution: "BBC Learning English",
      subject: "languages", level: "Beginner", language: "English",
      durationHours: 40, durationLabel: "Self-paced", weekly: "Flexible",
      price: "free", certificate: "none", score: 4.7, popularity: 88, added: "2024-02-06",
      featured: false, url: "https://www.bbc.co.uk/learningenglish/",
      short: "Free English lessons, videos, and audio for everyday, business, and academic English.",
      description: "BBC Learning English offers a large library of free lessons built around real news, conversations, and stories. You can practise grammar, vocabulary, pronunciation, and listening at different levels, with transcripts and exercises. It is especially good for learners who want authentic English.",
      skills: ["English", "Listening", "Vocabulary", "Grammar", "Pronunciation", "Everyday English"],
      syllabus: ["Beginner English", "Intermediate English", "English at work", "English for academic study", "Pronunciation", "News review", "6 Minute English", "Drama and stories"],
      requirements: "Basic literacy and internet access.",
      audience: "English learners at beginner to upper-intermediate levels who want free, authentic practice."
    },
    {
      id: "british-council",
      title: "LearnEnglish",
      provider: "britishcouncil", institution: "British Council",
      subject: "languages", level: "Beginner", language: "English",
      durationHours: 40, durationLabel: "Self-paced", weekly: "Flexible",
      price: "free", certificate: "none", score: 4.7, popularity: 85, added: "2024-03-12",
      featured: false, url: "https://learnenglish.britishcouncil.org/",
      short: "Structured English practice with lessons, exercises, and level tests from the British Council.",
      description: "LearnEnglish is the British Council's free learning site, with graded lessons from beginner to advanced. You will find grammar references, vocabulary exercises, listening and reading practice, and online level tests. It is a dependable supplement for exam preparation and general fluency.",
      skills: ["English", "Grammar", "Vocabulary", "Reading", "Listening", "Exam practice"],
      syllabus: ["Beginner to advanced grammar", "Vocabulary by topic", "Listening practice", "Reading practice", "Writing skills", "Speaking activities", "English for work", "Exam preparation"],
      requirements: "Internet access; a free account unlocks progress tracking.",
      audience: "Learners who want structured, trustworthy English practice at their own level."
    },
    {
      id: "khan-grammar",
      title: "Grammar",
      provider: "khan", institution: "Khan Academy",
      subject: "languages", level: "Beginner", language: "English",
      durationHours: 15, durationLabel: "Self-paced", weekly: "Flexible",
      price: "free", certificate: "none", score: 4.8, popularity: 82, added: "2024-04-16",
      featured: false, url: "https://www.khanacademy.org/humanities/grammar",
      short: "Fix the grammar gaps that make writing unclear, with short lessons and practice.",
      description: "Khan Academy's grammar course covers the conventions of standard English: parts of speech, sentence structure, punctuation, agreement, and style. Short videos and exercises make it useful for students, job seekers, and anyone who wants to write more confidently.",
      skills: ["Grammar", "Punctuation", "Sentence structure", "Writing", "Editing", "English"],
      syllabus: ["Parts of speech", "Sentences and clauses", "Punctuation", "Verb tense and agreement", "Pronouns", "Modifiers", "Parallel structure", "Style and usage", "Practice exercises"],
      requirements: "Basic English reading ability.",
      audience: "Students and professionals who want cleaner, more confident writing."
    },
    {
      id: "coursera-chinese",
      title: "Chinese for Beginners",
      provider: "coursera", institution: "Peking University", target: "Chinese",
      subject: "languages", level: "Beginner", language: "English",
      durationHours: 20, durationLabel: "7 weeks", weekly: "3 hrs/week",
      price: "audit", certificate: "paid", score: 4.8, popularity: 83, added: "2024-06-25",
      featured: false, url: "https://www.coursera.org/learn/learn-chinese",
      short: "Start speaking Mandarin with tones, everyday phrases, and practical conversations.",
      description: "This Peking University course introduces Mandarin Chinese for complete beginners. You will learn pinyin and tones, basic characters, greetings, numbers, family, food, and travel phrases. Video lessons and speaking practice focus on real conversations rather than rote memorisation.",
      skills: ["Mandarin", "Pinyin", "Tones", "Vocabulary", "Speaking", "Listening"],
      syllabus: ["Introduction to Chinese pronunciation", "Tones and pinyin", "Greetings and names", "Numbers and dates", "Family and friends", "Food and ordering", "Travel and directions", "Everyday conversation"],
      requirements: "No prior Chinese required.",
      audience: "Beginners who want a structured, university-led introduction to Mandarin."
    },

    /* ---------------- Humanities ---------------- */
    {
      id: "yale-death",
      title: "Death",
      provider: "yale", institution: "Yale University", instructor: "Shelly Kagan",
      subject: "humanities", level: "Intermediate", language: "English",
      durationHours: 26, durationLabel: "26 lectures", weekly: "Self-paced",
      price: "free", certificate: "none", score: 4.8, popularity: 83, added: "2024-01-20",
      featured: false, url: "https://oyc.yale.edu/philosophy/phil-176",
      short: "A philosophical inquiry into death, immortality, and what makes a life meaningful.",
      description: "Shelly Kagan's Death course asks difficult questions with clarity and wit: Is death bad for the person who dies? Could immortality be desirable? What does a person consist of? The lectures move between metaphysics, ethics, and everyday experience, and require no prior philosophy.",
      skills: ["Philosophy", "Ethics", "Metaphysics", "Argumentation", "Critical thinking", "Mortality"],
      syllabus: ["The nature of persons", "Dualism and physicalism", "The argument from personal identity", "What is death?", "Is death bad?", "The deprivation account", "Immortality", "Suicide and meaning", "The value of life", "Final discussion"],
      requirements: "An open mind and willingness to follow abstract arguments.",
      audience: "Anyone who wants to think seriously about life, death, and meaning."
    },
    {
      id: "harvard-justice",
      title: "Justice",
      provider: "edx", institution: "Harvard University", instructor: "Michael J. Sandel",
      subject: "humanities", level: "Intermediate", language: "English",
      durationHours: 30, durationLabel: "12 weeks", weekly: "3–6 hrs/week",
      price: "audit", certificate: "paid", score: 4.8, popularity: 89, added: "2024-02-28",
      featured: false, url: "https://www.edx.org/learn/justice/harvard-university-justice",
      short: "Michael Sandel's famous course on moral and political philosophy, from Aristotle to modern dilemmas.",
      description: "Justice introduces the great theories of justice and applies them to real controversies: affirmative action, markets, same-sex marriage, rights, and loyalty. Sandel's Socratic style turns abstract philosophy into a live argument. The course is available to audit for free on edX.",
      skills: ["Philosophy", "Ethics", "Political theory", "Argumentation", "Critical thinking", "Public reasoning"],
      syllabus: ["The moral side of murder", "The case for cannibalism", "Putting a price tag on life", "How to measure pleasure", "Free to choose", "Who owns me?", "This land is your land", "Consenting adults", "Justice and the common good", "Final essay"],
      requirements: "No philosophy background required.",
      audience: "Anyone interested in ethics, politics, law, or the arguments behind public policy."
    },
    {
      id: "crashcourse-world-history",
      title: "World History",
      provider: "crashcourse", institution: "CrashCourse",
      subject: "humanities", level: "Beginner", language: "English",
      durationHours: 15, durationLabel: "42 videos", weekly: "Self-paced",
      price: "free", certificate: "none", score: 4.6, popularity: 80, added: "2024-03-20",
      featured: false, url: "https://www.youtube.com/playlist?list=PLBDA2E52FB1EF80C9",
      short: "A fast, funny, and surprisingly deep tour of world history from the Agricultural Revolution onward.",
      description: "CrashCourse World History condenses thousands of years into short, energetic videos. Host John Green connects events, ideas, and consequences, from early civilisations and empires to revolutions and the modern world. It is an excellent overview before deeper reading.",
      skills: ["World history", "Historical thinking", "Civilisations", "Cause and effect", "Cultural literacy"],
      syllabus: ["The Agricultural Revolution", "Early civilisations", "Mesopotamia and Egypt", "Ancient Greece and Rome", "World religions", "The Silk Road", "Medieval Europe", "The Mongols", "The Renaissance", "Revolutions", "Colonialism", "The modern world"],
      requirements: "None.",
      audience: "Curious learners and students who want an accessible big-picture history."
    },
    {
      id: "yale-modern-poetry",
      title: "Modern Poetry",
      provider: "yale", institution: "Yale University", instructor: "Langdon Hammer",
      subject: "humanities", level: "Intermediate", language: "English",
      durationHours: 25, durationLabel: "25 lectures", weekly: "Self-paced",
      price: "free", certificate: "none", score: 4.7, popularity: 73, added: "2024-05-14",
      featured: false, url: "https://oyc.yale.edu/english/engl-310",
      short: "Read modernist poetry closely — Yeats, Eliot, Pound, Frost, Stevens, and more.",
      description: "This Yale course introduces the major poets of modernism and the questions their work raises about tradition, form, and meaning. Close readings are paired with historical context, helping you hear what makes a poem work. No previous poetry expertise is assumed.",
      skills: ["Poetry", "Literary analysis", "Close reading", "Modernism", "Writing", "Cultural history"],
      syllabus: ["Introduction to modern poetry", "Yeats and the Irish literary revival", "Frost and the American voice", "Pound and imagism", "Eliot and The Waste Land", "Stevens and imagination", "Williams and everyday language", "H.D. and modernist women poets", "Auden and the 1930s", "Later modernism"],
      requirements: "Willingness to read poems closely.",
      audience: "Readers and students who want to get more out of modern poetry."
    },
    {
      id: "coursera-humankind",
      title: "A Brief History of Humankind",
      provider: "coursera", institution: "Hebrew University of Jerusalem", instructor: "Yuval Noah Harari",
      subject: "humanities", level: "Beginner", language: "English",
      durationHours: 24, durationLabel: "17 weeks", weekly: "2 hrs/week",
      price: "audit", certificate: "paid", score: 4.7, popularity: 87, added: "2024-08-09",
      featured: false, url: "https://www.coursera.org/learn/history-of-humankind",
      short: "The story of our species, from foraging bands to empires, money, religion, and the modern world.",
      description: "Based on the book Sapiens, this course surveys the history of Homo sapiens. It explores the Cognitive, Agricultural, and Scientific Revolutions, and asks how shared stories about gods, nations, and money made large-scale cooperation possible. It is broad, provocative, and accessible.",
      skills: ["World history", "Anthropology", "Big history", "Critical thinking", "Cultural evolution"],
      syllabus: ["The Cognitive Revolution", "The Agricultural Revolution", "The unification of humankind", "The Scientific Revolution", "Empires and religion", "Money and trade", "The modern state", "The future of Homo sapiens"],
      requirements: "No prior history study needed.",
      audience: "Anyone who wants a big-picture understanding of human history."
    },

    /* ---------------- Career & Study Skills ---------------- */
    {
      id: "coursera-learning",
      title: "Learning How to Learn",
      provider: "coursera", institution: "McMaster University & UC San Diego", instructor: "Barbara Oakley, Terrence Sejnowski",
      subject: "career", level: "Beginner", language: "English",
      durationHours: 15, durationLabel: "4 weeks", weekly: "3–4 hrs/week",
      price: "audit", certificate: "paid", score: 4.9, popularity: 98, added: "2024-01-08",
      featured: true, url: "https://www.coursera.org/learn/learning-how-to-learn",
      short: "The most popular course on Coursera: practical techniques for learning anything more effectively.",
      description: "Learning How to Learn explains what happens in your brain when you study, and how to use that knowledge. You will learn about focused and diffuse thinking, chunking, memory, procrastination, and effective practice. The techniques apply to exams, languages, coding, and everyday skills.",
      skills: ["Learning techniques", "Memory", "Focus", "Procrastination", "Study planning", "Metacognition"],
      syllabus: ["Focused versus diffuse thinking", "Procrastination and memory", "Chunking", "Illusions of competence", "Interleaving and retrieval", "Sleep and exercise", "Test preparation", "Learning projects"],
      requirements: "None.",
      audience: "Students, professionals, and lifelong learners who want to study smarter."
    },
    {
      id: "coursera-mindshift",
      title: "Mindshift: Break Through Obstacles to Learning",
      provider: "coursera", institution: "McMaster University", instructor: "Barbara Oakley",
      subject: "career", level: "Beginner", language: "English",
      durationHours: 10, durationLabel: "4 weeks", weekly: "2–3 hrs/week",
      price: "audit", certificate: "paid", score: 4.7, popularity: 84, added: "2024-02-22",
      featured: false, url: "https://www.coursera.org/learn/mindshift",
      short: "Change how you think about ability, failure, and career change — and learn to learn again.",
      description: "Mindshift explores how people can change careers and learn difficult subjects later in life. It combines research on mindset, deliberate practice, and habit formation with stories of people who made big transitions. It is a companion to Learning How to Learn.",
      skills: ["Growth mindset", "Career change", "Deliberate practice", "Habits", "Resilience", "Learning"],
      syllabus: ["The need for change", "Growth mindset", "Learning through failure", "Deliberate practice", "Habits and environment", "Career transitions", "Building a learning plan", "Final reflection"],
      requirements: "None.",
      audience: "Adults considering a career change or returning to study."
    },
    {
      id: "coursera-speaking",
      title: "Introduction to Public Speaking",
      provider: "coursera", institution: "University of Washington",
      subject: "career", level: "Beginner", language: "English",
      durationHours: 12, durationLabel: "4 weeks", weekly: "3 hrs/week",
      price: "audit", certificate: "paid", score: 4.7, popularity: 86, added: "2024-04-04",
      featured: false, url: "https://www.coursera.org/learn/public-speaking",
      short: "Speak with clarity and confidence, from preparation and structure to delivery and handling nerves.",
      description: "This course teaches public speaking as a practical skill. You will learn how to analyse an audience, structure a talk, design visuals, manage anxiety, and deliver with presence. Short assignments let you practise and get feedback from peers.",
      skills: ["Public speaking", "Presentation", "Storytelling", "Confidence", "Audience analysis", "Delivery"],
      syllabus: ["Speaking with confidence", "Audience and purpose", "Structure and storytelling", "Visual aids", "Delivery and body language", "Managing nerves", "Q&A and impromptu speaking", "Final speech"],
      requirements: "A way to record short practice talks.",
      audience: "Students and professionals who want to present more effectively."
    },
    {
      id: "coursera-sciwrite",
      title: "Writing in the Sciences",
      provider: "coursera", institution: "Stanford Online", instructor: "Kristin Sainani",
      subject: "career", level: "Intermediate", language: "English",
      durationHours: 30, durationLabel: "3 weeks", weekly: "10 hrs/week",
      price: "audit", certificate: "paid", score: 4.9, popularity: 85, added: "2024-05-30",
      featured: false, url: "https://www.coursera.org/learn/sciwrite",
      short: "Write clearer scientific papers, reports, and proposals — with editing exercises from real writing.",
      description: "This Stanford course teaches scientists and students to write with clarity and precision. You will work on cutting clutter, choosing verbs, structuring paragraphs, writing manuscripts, and communicating with general audiences. Exercises use real scientific writing, and the principles transfer to any technical field.",
      skills: ["Scientific writing", "Editing", "Clarity", "Manuscripts", "Evidence", "Communication"],
      syllabus: ["Principles of effective writing", "Cutting unnecessary clutter", "Verbs and voice", "Sentence structure", "Paragraphs", "The format of a manuscript", "Peer review and publication", "Writing for general audiences"],
      requirements: "Comfort reading scientific material; no research experience required.",
      audience: "Students, researchers, and technical professionals who write about complex ideas."
    },
    {
      id: "coursera-excel",
      title: "Excel Skills for Business: Essentials",
      provider: "coursera", institution: "Macquarie University",
      subject: "career", level: "Beginner", language: "English",
      durationHours: 25, durationLabel: "6 weeks", weekly: "4 hrs/week",
      price: "audit", certificate: "paid", score: 4.8, popularity: 91, added: "2024-07-11",
      featured: false, url: "https://www.coursera.org/learn/excel-essentials",
      short: "From your first spreadsheet to formulas, charts, and clean data — the Excel skills employers assume.",
      description: "This course builds practical Excel confidence for study and work. You will learn navigation, formatting, formulas, functions, charts, tables, and data cleaning, with hands-on spreadsheets throughout. It is designed for beginners but covers habits that prevent costly mistakes.",
      skills: ["Excel", "Spreadsheets", "Formulas", "Charts", "Data cleaning", "Business analysis"],
      syllabus: ["Excel fundamentals", "Formatting and navigation", "Formulas and functions", "Working with large datasets", "Charts and visuals", "Tables and sorting", "Data cleaning", "Final project"],
      requirements: "Access to Excel or a compatible spreadsheet app.",
      audience: "Students and office workers who want a dependable foundation in spreadsheets."
    },

    /* ---------------- Music & Arts ---------------- */
    {
      id: "justinguitar",
      title: "Beginner Guitar Course",
      provider: "justinguitar", institution: "JustinGuitar", instructor: "Justin Sandercoe",
      subject: "music", level: "Beginner", language: "English",
      durationHours: 20, durationLabel: "9 stages", weekly: "Self-paced",
      price: "free", certificate: "none", score: 4.8, popularity: 86, added: "2024-02-10",
      featured: false, url: "https://www.justinguitar.com/classes/beginner-guitar-course-grade-one",
      short: "A complete, free beginner guitar course — chords, strumming, rhythm, and real songs.",
      description: "JustinGuitar's beginner course is one of the best-structured free music courses online. It starts with holding the guitar and tuning, then builds chords, strumming patterns, rhythm, and song practice in graded stages. Videos are friendly and concise, with practice routines.",
      skills: ["Guitar", "Chords", "Strumming", "Rhythm", "Music practice", "Songs"],
      syllabus: ["Getting started with guitar", "First chords and strumming", "Chord changes", "Rhythm and timing", "Open chords", "Barre chords", "Scales and improvisation", "Songs and performance", "Practice plan"],
      requirements: "An acoustic or electric guitar.",
      audience: "Absolute beginners who want a free, structured path to playing songs."
    },
    {
      id: "musictheory",
      title: "Music Theory Lessons",
      provider: "musictheory", institution: "musictheory.net",
      subject: "music", level: "Beginner", language: "English",
      durationHours: 10, durationLabel: "Self-paced", weekly: "Flexible",
      price: "free", certificate: "none", score: 4.7, popularity: 79, added: "2024-03-26",
      featured: false, url: "https://www.musictheory.net/lessons",
      short: "Read music and understand how it works, with clear lessons and interactive exercises.",
      description: "musictheory.net offers concise, well-illustrated lessons on the fundamentals of music. You will learn the staff, clefs, note values, keys, intervals, chords, and progressions, and can practise each concept with interactive exercises. It is an excellent companion to instrument practice.",
      skills: ["Music theory", "Notation", "Intervals", "Chords", "Scales", "Ear training"],
      syllabus: ["The staff and clefs", "Note duration", "Meter and rhythm", "Major and minor scales", "Key signatures", "Intervals", "Chords", "Chord progressions", "Ear training"],
      requirements: "None.",
      audience: "Musicians and curious listeners who want to understand the language of music."
    },
    {
      id: "yale-listening",
      title: "Listening to Music",
      provider: "yale", institution: "Yale University", instructor: "Craig Wright",
      subject: "music", level: "Beginner", language: "English",
      durationHours: 20, durationLabel: "23 lectures", weekly: "Self-paced",
      price: "free", certificate: "none", score: 4.7, popularity: 77, added: "2024-05-02",
      featured: false, url: "https://oyc.yale.edu/music/musi-112",
      short: "A guide to listening deeply to Western music, from Bach and Mozart to jazz and modern sounds.",
      description: "Craig Wright's Listening to Music teaches you how to hear structure, melody, rhythm, and harmony. The course moves through musical eras and genres with plenty of listening examples, including a famous lecture on why we love pop music. No technical background is required.",
      skills: ["Music appreciation", "Listening", "Music history", "Form", "Rhythm", "Critical listening"],
      syllabus: ["Introduction to listening", "Rhythm and melody", "Harmony and texture", "The Middle Ages and Renaissance", "Baroque music", "Classical music", "Romantic music", "The twentieth century", "Jazz and popular music", "Final listening project"],
      requirements: "A way to listen to music.",
      audience: "Anyone who wants to get more out of the music they hear."
    },
    {
      id: "coursera-musicprod",
      title: "Introduction to Music Production",
      provider: "coursera", institution: "Berklee College of Music",
      subject: "music", level: "Beginner", language: "English",
      durationHours: 15, durationLabel: "6 weeks", weekly: "3 hrs/week",
      price: "audit", certificate: "paid", score: 4.6, popularity: 75, added: "2024-06-18",
      featured: false, url: "https://www.coursera.org/learn/music-production",
      short: "Learn the basics of recording, editing, mixing, and producing music in a home studio.",
      description: "Berklee's Introduction to Music Production covers the practical side of making recordings. You will learn about microphones, signal flow, DAWs, editing, effects, and mixing. Assignments let you apply each concept to your own tracks, even with a modest setup.",
      skills: ["Music production", "Recording", "Mixing", "DAW", "Audio effects", "Home studio"],
      syllabus: ["The recording studio", "Microphones and signal flow", "Digital audio workstations", "Recording techniques", "Editing and comping", "EQ and compression", "Effects and mixing", "Final mix project"],
      requirements: "A computer, headphones, and ideally a microphone or instrument.",
      audience: "Musicians and creators who want to record and mix their own music."
    },
    {
      id: "coursera-modernart",
      title: "Modern Art & Ideas",
      provider: "coursera", institution: "The Museum of Modern Art (MoMA)",
      subject: "music", level: "Beginner", language: "English",
      durationHours: 15, durationLabel: "6 weeks", weekly: "3 hrs/week",
      price: "audit", certificate: "paid", score: 4.7, popularity: 81, added: "2024-08-28",
      featured: false, url: "https://www.coursera.org/learn/modern-art-ideas",
      short: "Look at modern art with confidence, guided by MoMA's curators and collections.",
      description: "Modern Art & Ideas introduces the ideas and contexts behind modern and contemporary art. Through MoMA's collection, you will explore how artists responded to war, technology, identity, and everyday life. It is designed for curious viewers rather than specialists.",
      skills: ["Art history", "Visual literacy", "Modern art", "Critical looking", "Cultural context"],
      syllabus: ["What is modern art?", "Art and everyday life", "Art and technology", "Art and identity", "Art and politics", "Looking at contemporary art", "Museum visit project"],
      requirements: "None.",
      audience: "Anyone who wants to understand modern art instead of feeling lost in a gallery."
    }
  ];

  const COLLECTIONS = [
    {
      id: "start-coding",
      title: "Start coding from zero",
      blurb: "No experience needed. Build a foundation, then make real projects.",
      icon: "⌨️",
      courseIds: ["fcc-responsive", "odin-foundations", "cs50x", "missing-semester", "python-everybody", "codewithharry-python"]
    },
    {
      id: "data-science-101",
      title: "Your first steps in data science",
      blurb: "Python, statistics, machine learning — in the right order.",
      icon: "📊",
      courseIds: ["kaggle-pandas", "khan-stats", "kaggle-intro-ml", "google-mlcc", "coursera-mml", "hf-nlp"]
    },
    {
      id: "learn-english",
      title: "English for work and study",
      blurb: "Practical English practice, from everyday conversation to clear writing.",
      icon: "🌍",
      courseIds: ["bbc-learning", "british-council", "khan-grammar", "coursera-sciwrite", "coursera-speaking"]
    },
    {
      id: "study-smarter",
      title: "Study smarter, not longer",
      blurb: "Evidence-based techniques for learning anything and remembering it.",
      icon: "🧠",
      courseIds: ["coursera-learning", "coursera-mindshift", "coursera-wellbeing", "yale-psych", "coursera-excel"]
    },
    {
      id: "india-picks",
      title: "Made for Indian learners",
      blurb: "Hindi-medium and India-based courses that are free to start today.",
      icon: "🇮🇳",
      courseIds: ["codewithharry-python", "khan-hindi-class10", "nptel-c", "khan-grammar", "fcc-responsive"]
    },
    {
      id: "free-certificates",
      title: "Free certificates worth sharing",
      blurb: "Finish a course and earn a certificate without paying.",
      icon: "🏅",
      courseIds: ["fcc-responsive", "fcc-js", "cs50x", "cs50-cyber", "fullstackopen", "kaggle-intro-ml", "kaggle-pandas", "hubspot-inbound"]
    }
  ];

  const LEVELS = ["Beginner", "Intermediate", "Advanced"];
  const LANGUAGES = ["English", "Hindi"];
  const SORTS = [
    { id: "recommended", label: "Recommended" },
    { id: "rating", label: "Highest rated" },
    { id: "popular", label: "Most popular" },
    { id: "newest", label: "Newest" },
    { id: "shortest", label: "Shortest first" }
  ];

  window.LN_DATA = {
    providers: PROVIDERS,
    subjects: SUBJECTS,
    courses: COURSES,
    collections: COLLECTIONS,
    levels: LEVELS,
    languages: LANGUAGES,
    sorts: SORTS,
    liveProviderIds: LIVE_PROVIDER_IDS,
    siteUrl: "https://mavaletejas6-tiger.github.io/learnova/"
  };
})();
