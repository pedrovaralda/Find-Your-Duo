import express from 'express'
import cors from 'cors'

import { PrismaClient } from '@prisma/client'
import { ConvertHourStringToMinutes } from './utils/convert-hour-string-to-minutes'
import { ConvertMinutesToHourString } from './utils/convert-minutes-to-hours-string'

const app = express()

app.use(express.json())
app.use(cors())

const prisma = new PrismaClient()

//Listagem de games
app.get('/games', async (request, response) => {
  const games = await prisma.game.findMany({
    include: {
      _count: {
        select: {
          ads: true,
        }
      }
    }
  })

  return response.json(games);
})

//Criação dos games
app.post('/games/:id/ads', async (request, response) => {
  const gameId = request.params.id;
  const body: any = request.body;

  const ad = await prisma.ad.create({
    data: {
      gameId,
      name: body.name,
      yearsPlaying: body.yearsPlaying,
      discord: body.discord,
      weekDays: body.weekDays.join(','),
      hourStart: ConvertHourStringToMinutes(body.hourStart),
      hourEnd: ConvertHourStringToMinutes(body.hourEnd),
      useVoiceChannel: body.useVoiceChannel,
    }
  })

  return response.status(201).json(ad);
})

//Busca por anúncios
app.get('/games/:id/ads', async (request, response) => {
  const gameId = request.params.id;

  const ads = await prisma.ad.findMany({
    select: {
      id: true,
      name: true,
      weekDays: true,
      useVoiceChannel: true,
      yearsPlaying: true,
      hourStart: true,
      hourEnd: true,
    },
    where: {
      gameId,
    },
    orderBy: {
      createdAt: 'desc',
    }
  })

  return response.json(ads.map(ad => {
    return {
      ...ad,
      weekDays: ad.weekDays.split(','),
      hourStart: ConvertMinutesToHourString(ad.hourStart),
      hourEnd: ConvertMinutesToHourString(ad.hourEnd),
    }
  }))
})

//Busca por discord
app.get('/ads/:id/discord', async (request, response) => {
  const adId = request.params.id;

  const ad = await prisma.ad.findUniqueOrThrow({
    select: {
      discord: true,
    },
    where: {
      id: adId,
    }
  })

  return response.json({
    discord: ad.discord,
  })
})

app.listen(3333)