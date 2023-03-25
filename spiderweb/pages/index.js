import Head from 'next/head'
import Image from 'next/image'

import styles from '@/styles/Home.module.css'
import { useState } from 'react';

function Card({card}){

  const [position, setPosition] = useState({x:0,y:0});

  function handleClick(){
    position.x = '200px';
    position.y = '300px';    
  }




  return  <div className={styles.card} 

              style={{
                left: position.x || '',
                top: position.y || ''
              }}
              onClick={handleClick}
            >
            <div className={styles.front}>
                <div className={styles.value}>
                  <Image alt='' src={ (card.suit==='spade' || card.suit==='club') ? `./svg/${card.value}.svg` : `./svg/${card.value}_red.svg`} width={200} height={200}></Image>
                </div>
                <div className={styles.suit}>
                  <Image alt='' src={`./svg/${card.suit}.svg`} width={200} height={200}></Image>
                </div>
                <div className={styles.content}>
                  <Image alt='' src={`./svg/${card.suit}_${card.value}_content.svg`} width={200} height={200}></Image>
                </div>
            </div>
            <div className={styles.back}>
                <img src="./svg/back.svg" />
            </div>
        </div>
}


export default function Home() {
  const values = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  const suites = ['spade','heart','club','diamond','spade','heart','club','diamond'];

  let cards = [];

  suites.forEach( s => {
    values.forEach( v => {
      cards.push({value:v,suit:s});
    })
  })

  cards = cards.map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value)

  const [positions, setPositions] = useState([Array(cards.length).fill({x:0,y:0})]);




  function test(){

    positions[0] = {x:'100px',y:'100px'};

    setPositions(positions)

    // console.log(positions)
  }



  return (
    <>
      <Head>
        <title>Spider Pocket</title>
        <meta name="description" content="Generated by create wov." />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#85BC87" />       
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <div className={styles.gameContainer}>
          <div className={styles.cardsContainer}>
          {cards.map((card,card_index) => {
            const position = positions[card_index];
           return  <Card key={`card_${card_index}`} card={card} positions={positions} cardindex={card_index}></Card>
          })}
          </div>
          <div className={styles.controlContainer}>
            <button onClick={test}>MENU</button>
          </div>
        </div>

      
      </main>
    </>
  )
}