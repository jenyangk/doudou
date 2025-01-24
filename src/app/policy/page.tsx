'use client'

import Link from "next/link";
import Image from "next/image";
import Profile from "@/components/Profile";

export default function PrivacyPolicy() {
    return (
        <div className="flex flex-col w-full min-h-screen">
            <header className='sticky top-0 flex h-12 items-center gap-4 border-b bg-background px-4 md:px-6 justify-between'>
                <div className='flex items-center space-x-2 gap-2'>
                    <Link href="/" className="hover:opacity-80">
                        <Image 
                            src='/icon.png' 
                            alt="DouDou" 
                            width={32} 
                            height={32} 
                            className="transition-opacity" 
                        />
                    </Link>
                </div>
                <span className='text-md font-bold flex items-center space-x-2 gap-2'>
                    <Profile />
                </span>
            </header>

            <main className="flex-1 py-8 px-4 md:px-6">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
                    <h2 className="text-xs font-semibold text-center text-gray-600 mb-8">
                        Last updated: {new Date().toLocaleDateString()}
                    </h2>
                    <div className="prose max-w-2xl mx-auto text-justify text-sm">
                        This Privacy Policy describes how Muniee (the "Site", "we", "us", or "our") collects, uses, and discloses your personal information when you visit, use our services, or make a purchase from muniee.com (the "Site") or otherwise communicate with us (collectively, the "Services"). For purposes of this Privacy Policy, "you" and "your" means you as the user of the Services, whether you are a customer, website visitor, or another individual whose information we have collected pursuant to this Privacy Policy.

                        Please read this Privacy Policy carefully. By using and accessing any of the Services, you agree to the collection, use, and disclosure of your information as described in this Privacy Policy. If you do not agree to this Privacy Policy, please do not use or access any of the Services.

                        <h3 className="text-xl font-bold mt-6 text-left">Changes to This Privacy Policy</h3>

                        We may update this Privacy Policy from time to time, including to reflect changes to our practices or for other operational, legal, or regulatory reasons. We will post the revised Privacy Policy on the Site, update the "Last updated" date and take any other steps required by applicable law.

                        <h3 className="text-xl font-bold mt-6 text-left">How We Collect and Use Your Personal Information</h3>

                        To provide the Services, we collect and have collected over the past 12 months personal information about you from a variety of sources, as set out below. The information that we collect and use varies depending on how you interact with us.

                        In addition to the specific uses set out below, we may use information we collect about you to communicate with you, provide the Services, comply with any applicable legal obligations, enforce any applicable terms of service, and to protect or defend the Services, our rights, and the rights of our users or others.

                        <h3 className="text-xl font-bold mt-6 text-left">What Personal Information We Collect</h3>

                        The types of personal information we obtain about you depends on how you interact with our Site and use our Services. When we use the term "personal information", we are referring to information that identifies, relates to, describes or can be associated with you. The following sections describe the categories and specific types of personal information we collect.

                        <h3 className="text-xl font-bold mt-6 text-left">Information We Collect Directly from You</h3>

                        Information that you directly submit to us through our Services may include:

                        - Basic contact details including your name, address, phone number, email.
                        - Order information including your name, billing address, shipping address, payment confirmation, email address, phone number.
                        - Account information including your username, password, security questions.
                        - Shopping information including the items you view, put in your cart or add to your wishlist.
                        - Customer support information including the information you choose to include in communications with us, for example, when sending a message through the Services.

                        Some features of the Services may require you to directly provide us with certain information about yourself. You may elect not to provide this information, but doing so may prevent you from using or accessing these features.

                        <h3 className="text-xl font-bold mt-6 text-left">Information We Collect through Cookies</h3>

                        We also automatically collect certain information about your interaction with the Services ("Usage Data"). To do this, we may use cookies, pixels and similar technologies ("Cookies"). Usage Data may include information about how you access and use our Site and your account, including device information, browser information, information about your network connection, your IP address and other information regarding your interaction with the Services.

                        <h3 className="text-xl font-bold mt-6 text-left">Information We Obtain from Third Parties</h3>

                        Finally, we may obtain information about you from third parties, including from vendors and service providers who may collect information on our behalf, such as:

                        - Companies who support our Site and Services.
                        - Our payment processors, who collect payment information (e.g., bank account, credit or debit card information, billing address) to process your payment in order to fulfill your orders and provide you with products or services you have requested, in order to perform our contract with you.
                        - When you visit our Site, open or click on emails we send you, or interact with our Services or advertisements, we, or third parties we work with, may automatically collect certain information using online tracking technologies such as pixels, web beacons, software developer kits, third-party libraries, and cookies.

                        Any information we obtain from third parties will be treated in accordance with this Privacy Policy. We are not responsible or liable for the accuracy of the information provided to us by third parties and are not responsible for any third party's policies or practices. For more information, see the section below, Third Party Websites and Links.

                        <h3 className="text-xl font-bold mt-6 text-left">How We Use Your Personal Information</h3>

                        - Providing Products and Services. We use your personal information to provide you with the Services in order to perform our contract with you, including to process your payments, fulfill your orders, to send notifications to you related to you account, purchases, returns, exchanges or other transactions, to create, maintain and otherwise manage your account, to arrange for shipping, facilitate any returns and exchanges and to enable you to post reviews.
                        - Marketing and Advertising. We use your personal information for marketing and promotional purposes, such as to send marketing, advertising and promotional communications by email, text message or postal mail, and to show you advertisements for products or services. This may include using your personal information to better tailor the Services and advertising on our Site and other websites.
                        - Security and Fraud Prevention. We use your personal information to detect, investigate or take action regarding possible fraudulent, illegal or malicious activity. If you choose to use the Services and register an account, you are responsible for keeping your account credentials safe. We highly recommend that you do not share your username, password, or other access details with anyone else. If you believe your account has been compromised, please contact us immediately.
                        - Communicating with you. We use your personal information to provide you with customer support and improve our Services. This is in our legitimate interests in order to be responsive to you, to provide effective services to you, and to maintain our business relationship with you.

                        <h3 className="text-xl font-bold mt-6 text-left">How We Disclose Personal Information</h3>

                        In certain circumstances, we may disclose your personal information to third parties for legitimate purposes subject to this Privacy Policy. Such circumstances may include:

                        - With vendors or other third parties who perform services on our behalf (e.g., IT management, payment processing, data analytics, customer support, cloud storage, fulfillment and shipping).
                        - When you direct, request us or otherwise consent to our disclosure of certain information to third parties, such as to ship you products or through your use of social media widgets or login integrations, with your consent.
                        - With our affiliates or otherwise within our corporate group, in our legitimate interests to run a successful business.
                        - In connection with a business transaction such as a merger or bankruptcy, to comply with any applicable legal obligations (including to respond to subpoenas, search warrants and similar requests), to enforce any applicable terms of service, and to protect or defend the Services, our rights, and the rights of our users or others.

                        We have, in the past 12 months disclosed the following categories of personal information and sensitive personal information (denoted by *) about users for the purposes set out above in "How we Collect and Use your Personal Information" and "How we Disclose Personal Information":

                        Category:

                        - Identifiers such as basic contact details and certain order and account information
                        - Commercial information such as order information, shopping information and customer support information
                        - Internet or other similar network activity, such as Usage Data

                        Categories of Recipients:

                        - Vendors and third parties who perform services on our behalf (such as Internet service providers, payment processors, fulfillment partners, customer support partners and data analytics providers)
                        - Business and marketing partners
                        - Affiliates

                        We do not use or disclose sensitive personal information for the purposes of inferring characteristics about you.

                        <h3 className="text-xl font-bold mt-6 text-left">Security and Retention of Your Information</h3>

                        Please be aware that no security measures are perfect or impenetrable, and we cannot guarantee "perfect security." In addition, any information you send to us may not be secure while in transit. We recommend that you do not use unsecure channels to communicate sensitive or confidential information to us.

                        How long we retain your personal information depends on different factors, such as whether we need the information to maintain your account, to provide the Services, comply with legal obligations, resolve disputes or enforce other applicable contracts and policies.

                        <h3 className="text-xl font-bold mt-6 text-left">Your Rights and Choices</h3>

                        Depending on where you live, you may have some or all of the rights listed below in relation to your personal information. However, these rights are not absolute, may apply only in certain circumstances and, in certain cases, we may decline your request as permitted by law.

                        - Right to Access / Know. You may have a right to request access to personal information that we hold about you, including details relating to the ways in which we use and share your information.
                        - Right to Delete. You may have a right to request that we delete personal information we maintain about you.
                        - Right to Correct. You may have a right to request that we correct inaccurate personal information we maintain about you.
                        - Right of Portability. You may have a right to receive a copy of the personal information we hold about you and to request that we transfer it to a third party, in certain circumstances and with certain exceptions.

                        You may exercise any of these rights where indicated on our Site or by contacting us using the contact details provided below.

                        We will not discriminate against you for exercising any of these rights. We may need to collect information from you to verify your identity, such as your email address or account information, before providing a substantive response to the request. In accordance with applicable laws, You may designate an authorized agent to make requests on your behalf to exercise your rights. Before accepting such a request from an agent, we will require that the agent provide proof you have authorized them to act on your behalf, and we may need you to verify your identity directly with us. We will respond to your request in a timely manner as required under applicable law.

                        <h3 className="text-xl font-bold mt-6 text-left">Complaints</h3>

                        If you have complaints about how we process your personal information, please contact us using the contact details provided below. If you are not satisfied with our response to your complaint, depending on where you live you may have the right to appeal our decision by contacting us using the contact details set out below, or lodge your complaint with your local data protection authority.

                        <h3 className="text-xl font-bold mt-6 text-left">International Users</h3>

                        Please note that we may transfer, store and process your personal information outside the country you live in, including the United States. Your personal information is also processed by staff and third party service providers and partners in these countries.
                        If we transfer your personal information out of Europe, we will rely on recognized transfer mechanisms like the European Commission's Standard Contractual Clauses, or any equivalent contracts issued by the relevant competent authority of the UK, as relevant, unless the data transfer is to a country that has been determined to provide an adequate level of protection.

                        <h3 className="text-xl font-bold mt-6 text-left">Contact</h3>

                        Should you have any questions about our privacy practices or this Privacy Policy, or if you would like to exercise any of the rights available to you, please email us at muniee.lah@gmail.com.

                        For the purpose of applicable data protection laws, we are the data controller of your personal information.
                    </div>
                </div>
            </main>

            <footer className="border-t py-4 px-4 md:px-6">
                <div className="max-w-sm mx-auto flex justify-center gap-4 text-sm text-gray-500">
                    <Link href="/tos" className="hover:text-gray-900 transition-colors">
                        Terms of Service
                    </Link>
                    <Link href="/policy" className="hover:text-gray-900 transition-colors">
                        Privacy Policy
                    </Link>
                </div>
            </footer>
        </div>
    );
}