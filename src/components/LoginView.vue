<template>
  <div class="login-container">
    <div class="login-box">
      <h2>Phone Sign In</h2>
      
      <!-- Phone Authentication Form -->
      <form @submit.prevent="handlePhoneSubmit" class="phone-form">
        <!-- Phone Number Input -->
        <div class="form-group" v-if="!verificationStarted">
          <label for="phoneNumber">Phone Number</label>
          <div class="phone-input">
            <select v-model="countryCode" class="country-code">
              <option value="+91">+91 (IN)</option>
              <option value="+1">+1 (US)</option>
              <!-- Add more country codes as needed -->
            </select>
            <input
              id="phoneNumber"
              v-model="phoneNumber"
              type="tel"
              required
              placeholder="Enter your phone number"
              pattern="[0-9]{10}"
              title="Please enter a valid 10-digit phone number"
            >
          </div>
        </div>

        <!-- Verification Code Input -->
        <div class="form-group" v-if="verificationStarted">
          <label for="verificationCode">Verification Code</label>
          <input
            id="verificationCode"
            v-model="verificationCode"
            type="text"
            required
            placeholder="Enter 6-digit code"
            pattern="[0-9]{6}"
            maxlength="6"
          >
        </div>

        <button 
          type="button" 
          class="submit-btn" 
          :disabled="loading"
          :id="verificationStarted ? 'verify-code-button' : 'phone-sign-in-button'"
          @click="handlePhoneSubmit"
        >
          {{ verificationStarted ? 'Verify Code' : 'Send Code' }}
        </button>

        <p v-if="error" class="error-message">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

export default defineComponent({
  name: 'LoginView',
  setup() {
    const authStore = useAuthStore();
    const router = useRouter();

    const loading = ref(false);
    const error = ref('');

    // Phone authentication
    const countryCode = ref('+91');
    const phoneNumber = ref('');
    const verificationCode = ref('');
    const verificationStarted = ref(false);



    async function handlePhoneSubmit() {
      console.log('Phone submit handler called, verificationStarted:', verificationStarted.value);
      try {
        loading.value = true;
        error.value = '';

        if (!verificationStarted.value) {
          // Start phone verification
          let fullPhoneNumber = phoneNumber.value.replace(/[^0-9]/g, '');
          if (!fullPhoneNumber.startsWith(countryCode.value.slice(1))) {
            fullPhoneNumber = countryCode.value.slice(1) + fullPhoneNumber;
          }
          fullPhoneNumber = '+' + fullPhoneNumber;

          const success = await authStore.startPhoneVerification(fullPhoneNumber, 'phone-sign-in-button');
          if (success) {
            verificationStarted.value = true;
            error.value = 'Verification code sent! Please check your phone.';
          }
        } else {
          // Verify the code
          console.log('Attempting to verify code:', verificationCode.value);
          console.log('Button clicked:', document.activeElement?.id);
          if (!verificationCode.value || verificationCode.value.length !== 6) {
            error.value = 'Please enter a valid 6-digit code';
            return;
          }

          console.log('Calling verifyPhoneCode with:', verificationCode.value);
          const success = await authStore.verifyPhoneCode(verificationCode.value);
          console.log('Verification result:', success);
          if (success) {
            router.push('/');
          }
        }
      } catch (e) {
        error.value = (e as Error).message;
      } finally {
        loading.value = false;
      }
    }


    return {
      loading,
      error,
      // Phone auth
      countryCode,
      phoneNumber,
      verificationCode,
      verificationStarted,
      handlePhoneSubmit
    };
  }
});
</script>

<style scoped>
.phone-form {
  width: 100%;
  max-width: 400px;
}


.phone-input {
  display: flex;
  gap: 0.5rem;
}

.country-code {
  width: 120px;
  padding: 0.75rem;
  border: 1px solid #444;
  border-radius: 4px;
  background-color: #333;
  color: #fff;
  font-size: 1rem;
}

.country-code:focus {
  outline: none;
  border-color: #1976D2;
}

.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #1a1a1a;
}

.login-box {
  background-color: #2a2a2a;
  padding: 2rem;
  border-radius: 8px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

h2 {
  color: #fff;
  text-align: center;
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  color: #fff;
  margin-bottom: 0.5rem;
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #444;
  border-radius: 4px;
  background-color: #333;
  color: #fff;
  font-size: 1rem;
}

input:focus {
  outline: none;
  border-color: #1976D2;
}

.submit-btn, .google-btn {
  width: 100%;
  padding: 0.75rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.submit-btn {
  background-color: #1976D2;
  color: white;
  margin-bottom: 1rem;
}

.submit-btn:hover {
  background-color: #1565C0;
}

.divider {
  text-align: center;
  color: #666;
  margin: 1rem 0;
  position: relative;
}

.divider::before,
.divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 45%;
  height: 1px;
  background-color: #444;
}

.divider::before {
  left: 0;
}

.divider::after {
  right: 0;
}

.toggle-text {
  text-align: center;
  color: #666;
  margin-top: 1rem;
}

.toggle-text a {
  color: #1976D2;
  text-decoration: none;
}

.toggle-text a:hover {
  text-decoration: underline;
}

.error-message {
  color: #f44336;
  text-align: center;
  margin-top: 1rem;
}

button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>
