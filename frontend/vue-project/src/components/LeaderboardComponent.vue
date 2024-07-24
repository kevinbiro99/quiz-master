<template>
  <div class="leaderboard-wrapper">
    <div class="header">
      <img src="@/assets/leaderboard.png" alt="Leaderboard Icon" class="leaderboard-icon" />
      <h2 class="header-title">Leaderboard</h2>
    </div>
    <div class="leaderboard-container">
      <div
        v-for="(participant, index) in sortedParticipants"
        :key="participant.username || index"
        :class="['leaderboard-item', { highlighted: isCurrentUser(participant) }]"
        :style="podiumStyle(index)"
        ref="leaderboardItems"
      >
        <div class="row">
          <div class="col-1 leaderboard-rank">{{ index + 1 }}</div>
          <div class="col-5 leaderboard-name">{{ participant.username || '-' }}</div>
          <div class="col-6 leaderboard-score">{{ tweenedScores[participant.username] }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { state } from '@/socket'
import { gsap } from 'gsap'
import { Flip } from 'gsap/Flip'

gsap.registerPlugin(Flip)

export default {
  data() {
    return {
      tweenedScores: {}
    }
  },
  computed: {
    state() {
      return state
    },
    sortedParticipants() {
      return [...this.state.participants].sort((a, b) => b.score - a.score)
    },
    currentUser() {
      return (
        this.sortedParticipants.find(
          (participant) => participant.username === this.state.username
        ) || {}
      )
    }
  },
  methods: {
    isCurrentUser(participant) {
      return participant.username === this.state.username
    },
    podiumStyle(index) {
      const colors = ['#FFD700', '#C0C0C0', '#CD7F32', '#D3D3D3', '#D3D3D3']
      return {
        backgroundColor: colors[index] || 'transparent',
        color: index < 3 ? 'black' : '#333',
        padding: '10px',
        borderRadius: '10px',
        margin: '5px 0',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        fontSize: '1em',
        fontWeight: 'bold'
      }
    }
  },
  watch: {
    sortedParticipants: {
      handler(newParticipants) {
        newParticipants.forEach((participant) => {
          if (!this.tweenedScores[participant.username]) {
            this.tweenedScores[participant.username] = 0
          }
          gsap.to(this.tweenedScores, {
            duration: 0.5,
            [participant.username]: participant.score,
            roundProps: participant.username
          })
        })

        // Animate the reordering of leaderboard items
        const state = Flip.getState(this.$refs.leaderboardItems)
        this.$nextTick(() => {
          Flip.from(state, {
            duration: 1,
            ease: 'power2.inOut',
            stagger: 0.1,
            onComplete: () => {
              this.$refs.leaderboardItems.forEach((item) => {
                item.style.opacity = '1'
                item.style.transform = 'translateY(0)'
              })
            }
          })
        })
      },
      deep: true
    }
  },
  mounted() {
    this.sortedParticipants.forEach((participant, index) => {
      this.tweenedScores[participant.username] = 0
      if (this.$refs.leaderboardItems) {
        gsap.to(this.$refs.leaderboardItems[index], {
          duration: 0.5,
          y: 0,
          opacity: 1,
          stagger: 0.2
        })
      }
    })
  }
}
</script>

<style scoped>
@import '@/assets/cols.css';

.leaderboard-wrapper {
  text-align: center;
  margin: 20px;
  font-family: 'Arial', sans-serif;
  width: 100%;
  position: relative;
  border-top: 4px solid rgba(0, 0, 0, 0.1);
}

.row {
  width: 100%;
}

.header {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 20px;
}

.leaderboard-icon {
  width: 50px;
  height: 50px;
  margin-right: 15px;
}

.header-title {
  font-size: 1.5em;
  font-weight: bold;
  margin: 0;
}

.leaderboard-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 auto;
  width: 100%;
}

.leaderboard-item {
  display: flex;
  flex-wrap: wrap;
  width: 90%;
  background-color: #f4f4f4;
  border-radius: 10px;
  padding: 10px;
  margin: 5px 0;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  opacity: 0;
  transform: translateY(20px);
}

.leaderboard-rank,
.leaderboard-name,
.leaderboard-score {
  text-align: center;
}

.leaderboard-rank {
  font-size: 1em;
  font-weight: bold;
}

.leaderboard-name,
.leaderboard-score {
  font-size: 1em;
}

.highlighted {
  border: 2px solid #00bd7e;
  background-color: #e0f7f3;
}
</style>
